# Fallback video → continuous, guided verification — feasibility & plan

**Status:** Draft for discussion · **Date:** 2026-06-17

## Goal

Make the fallback identity-check journey less frictional and more accessible:

1. Replace the single 5s record → review → submit flow with **continuous/periodic
   verification**: the camera stays on, we sample frames while the user is in front
   of it, and we tell them as soon as Rekognition matches them. No manual submit.
2. Replace the 5s timer with a **generous timeout (15–30 min)**.
3. **Guide the user — especially visually impaired users — to centre their head**
   before we spend a Rekognition comparison, using an on-device (client-side) face
   detector. Used as a *gate*, this also keeps Rekognition/S3 cost sane.

## Current journey (baseline)

Frontend: `assets/js/face-liveness/fallback-video.ts` + `api.ts`.

1. `getUserMedia` → live `<video>` preview (480×640-ish, no audio).
2. **Start** → 3s countdown → capture **one** canvas frame at 2s → stop at 5s.
3. **Review** screen → user confirms → `fetchSnapshotUploadLocation` (POST
   `/{id}/liveness/upload-url`, sends SHA-256 of the bytes) → `uploadSnapshot`
   (direct PUT to presigned S3 URL) → `fetchVideoVerifyResult` (GET
   `/{id}/video/verify`).
4. Backend (`hmpps-esupervision-api`) reads the snapshot from S3 and runs
   Rekognition `CompareFaces` vs the reference image → `MATCH | NO_MATCH`.

Screens are nunjucks partials under
`server/views/pages/submission/liveness/fallback/partials/`
(`review`, `loading`, `match`, `nomatch`, `error`).

## Backend contract (confirmed in hmpps-esupervision-api)

These are the facts the new design relies on:

- **`POST /v2/offender_checkins/{id}/video-verify?numSnapshots=N`** expects snapshots
  to already be in S3 at indices `0..N-1`, runs `CompareFaces` for each (in parallel),
  returns the first `MATCH` or the best similarity otherwise.
- **It is safe to call repeatedly.** Each call *overwrites* `autoIdCheck` /
  `autoIdCheckScore` on the checkin and does **not** transition state. ✅ This is what
  makes continuous verify possible without a backend change.
- **The checkin stays `CREATED` for ~3 days** (dueDate + 3-day grace). So a 15–30 min
  client window has **no backend session/expiry conflict**.
- **`upload_location`** mints presigned URLs keyed by index (`checkin-{id}/{index}`),
  supports requesting several at once, and can be called repeatedly. **Presigned URL
  TTL = 10 min** — fine, we already mint a fresh URL per upload.
- Rekognition threshold = **90.0** similarity. Outcomes: `MATCH`, `NO_MATCH`,
  `NO_FACE_DETECTED`, `ERROR`.
- ⚠️ **Each non-MATCH attempt writes an audit row** to `offender_event_log_v2`.
  High-frequency verification would spam this log. The client-side gate (below)
  mitigates it; we may also want a backend tweak to suppress/aggregate audit noise
  in "periodic" mode — to coordinate with the API team. Not a blocker for A.

**Net:** workstream A (continuous verify + long timeout) is achievable with
frontend-only changes; backend coordination is limited to audit-log noise.

---

## Workstream A — continuous / periodic verify

### Loop (each cycle, while not matched and within the timeout)

1. Client-side face gate (workstream B) says "a face is present and roughly centred".
2. Grab a canvas frame.
3. `fetchSnapshotUploadLocation` (overwrite index 0) → `uploadSnapshot`.
4. `fetchVideoVerifyResult` (`numSnapshots=1`).
5. On `MATCH` → announce success, stop the camera, advance. On non-match → keep going.

Cadence is **gated, not fixed** (per decision): we only upload/verify when the gate is
satisfied, then back off (e.g. min 2–3s between verifies) so we don't hammer S3/Rekognition.
A hard cap on total attempts plus the wall-clock timeout bound the cost.

### Timeout

- Replace `RECORDING_TIME` (5s) with a configurable ceiling (15 or 30 min).
- On timeout: stop the camera and route to the existing no-match/manual path.
- Keep the camera-permission-denied path as-is.

### State/UX changes

- Remove the **review** + manual **continue** step (no more "submit if happy").
- New live status region: "Looking for you…", "Got it — matched!", plus the directional
  guidance from B. Reuse `match` / `error` partials; the `nomatch` partial becomes the
  **timeout** outcome (see "Non-match handling").

### Non-match handling (decided)

In a continuous loop, a per-cycle `NO_MATCH` is **"not yet", not a failure**. The failure
conversation happens **once, at timeout** — never per cycle. Outcome handling:

| Backend result | In the loop |
|---|---|
| `MATCH` | Success — announce, stop camera, advance. Terminal. |
| `NO_MATCH` | Transient — keep looping. Drives only a **subtle progress hint** (below). |
| `NO_FACE_DETECTED` | Actionable positioning guidance ("we can't see your face") — workstream B. |
| `ERROR` | Transient infra error — back off, retry silently; surface only if persistent. |

**Mid-loop feedback = subtle progress hint (decided).** A neutral, continuously-visible
"Checking…" indicator so the user knows it's working — but **never** a per-cycle
"no match". ⚠️ Accessibility: the visual hint animates without `aria-live`; for screen
readers we announce "Checking — keep your face in view" **once** when the loop starts,
then stay silent except for positioning changes and the terminal result. Do **not**
re-announce "still checking" each cycle (floods the SR queue).

**Timeout screen = try again + submit anyway (decided).** Preserves today's safety net:
- **Try again** → restart the loop.
- **Submit anyway** → proceed with submission flagged `NO_MATCH` → **manual review**
  (matches current backend behaviour). Kept deliberately so face-match bias can never
  hard-block a legitimate user.

**Two terminal messages (decided).** Use the client gate to distinguish:
- *Never got enough centred/clear frames* → "We couldn't see you clearly" + lighting/
  positioning tips; lead with **try again**.
- *Got good frames, none matched ≥90%* → "We couldn't confirm it's you" + offer
  **submit anyway** / manual review.

This needs the loop to track whether the gate ever fired with a good-quality, centred
frame (a simple boolean / counter), so the timeout handler can pick the right message.

### Cost control (per decision: "client gate then verify")

- Only verify when the gate passes ⇒ most idle/empty frames never reach Rekognition.
- Backoff + attempt cap + wall-clock timeout bound worst case.
- Open item: confirm current `CompareFaces` pricing and any account rate limits so we
  can set cadence/cap with real numbers.

### Risks / open items (A)

- Audit-log volume (see backend note) — coordinate with API team.
- Camera on for up to 30 min: battery/thermal on mobile; consider pausing sampling when
  the tab is backgrounded (`visibilitychange`) and when the gate hasn't passed.
- Define "give up" UX clearly so a VI user is never left in an unbounded loop.

---

## Workstream B — on-device head-position guidance

### Library choice

**Recommended: MediaPipe Face Detection** (Google, Apache-2.0). Runs locally via
WASM/WebGL, real-time, returns a bounding box + key landmarks. We use the box centre vs
frame centre to derive direction.

Alternatives considered: TF.js **BlazeFace** (simpler, box only — enough for centring);
**face-api.js** (older, less maintained); native `FaceDetector`/Shape Detection API
(too thin browser support — reject).

For an MVP gate, **BlazeFace or MediaPipe Face Detection** (bounding box only) is enough;
FaceMesh (468 landmarks) is overkill unless we later want finer guidance.

### What it computes

- Face present? (gate precondition)
- Box centre offset from frame centre → `move left / right / up / down`.
- Box size vs frame → `move closer / move back`.
- "Centred + large enough + stable for ~0.5s" → trigger the verify cycle.

### Why on-device matters

- **Privacy:** only the frames we choose to verify ever leave the device.
- **Cost:** it's the gate that keeps Rekognition calls down (workstream A decision).
- **Latency:** guidance is instant; no server round-trip per frame.

### Spike (½–1 day, do this first — de-risks everything)

1. Add MediaPipe Face Detection (or BlazeFace) to a throwaway page wired to `getUserMedia`.
2. Confirm it detects + tracks a face at a usable frame rate on a **target mobile device**
   (test the actual device profile of our users, not just desktop Chrome).
3. Measure **bundle + model/WASM size**; confirm we can **self-host** the assets (no CDN)
   and that it fits **CSP** (`wasm-unsafe-eval` / `worker-src` etc. may be needed).
4. Prototype centre-offset → direction mapping and eyeball its stability (needs debouncing).

Spike exit criteria: works on target device, acceptable size, CSP-compatible, stable
direction signal. If any fail, fall back to a cruder "face present (yes/no)" gate, which
still delivers workstream A's cost control.

### Build (after spike)

- Detection module under `assets/js/face-liveness/` (e.g. `face-gate.ts`) exposing a
  callback with `{ present, dx, dy, sizeRatio, centred }`.
- Self-host model/WASM under `assets/` and wire into the esbuild config + CSP.
- Integrate the gate into the continuous-verify loop from A.

---

## Accessibility design (non-visual guidance)

The continuous model already helps VI users hugely: they no longer have to nail one blind
shot — they adjust until they hear "matched". Guidance must be fully non-visual:

- **Announcements via `aria-live`.** Use `polite` for directional nudges, `assertive`
  only for the terminal "Matched!" / "We couldn't verify you" messages.
- **Throttle hard.** Debounce to ~one announcement / 1.5s and only when the message
  *changes* (e.g. don't repeat "move left" every frame) — otherwise the screen reader
  queue floods and becomes unusable.
- **Coarse, actionable directions:** "Move your phone a little to the right",
  "Move your face closer", "Hold still". Avoid precise degrees/pixels.
- **Consider audio cues** (a rising tone as you approach centre, a confirmation chime on
  match) as an optional layer — useful, but announcements are the baseline. Web has no
  reliable haptics.
- **Clear start and end states:** announce when the camera is ready and listening, and
  always announce a bounded outcome (matched, or timed out → here's what to do next).
- **Welsh translations** required for every new string (service is bilingual). Leave a
  clear list of new keys for translation; mirror the pattern in existing `_en/_cy` content.
- Test with **VoiceOver (iOS)** and **TalkBack (Android)** on real devices, plus keyboard-only.

---

## Recommended sequencing

1. **Spike B** (½–1 day): prove on-device detection on a target device; measure size + CSP.
2. **Confirm cost numbers** (CompareFaces pricing, rate limits) and **agree audit-log
   handling** with the API team.
3. **Ship A** with a crude "face present" gate + 15–30 min timeout (big friction win,
   low risk, frontend-only).
4. **Layer in B's directional guidance + accessible announcements + Welsh** as a
   fast-follow.

## Decisions made

- Cadence: **client-side gate, then verify** (only spend Rekognition when a face is
  detected/centred).
- Mid-loop feedback: **subtle progress hint** (visual continuous; SR announced once),
  never per-cycle non-match.
- Timeout screen: **try again + submit anyway** (submit-anyway → manual review).
- Terminal messaging: **two messages** — "couldn't see you clearly" vs "couldn't
  confirm it's you" — driven by whether the gate ever captured a good frame.

## Open decisions

- Timeout value: **15 vs 30 min** (and whether configurable per environment).
- Gate fidelity for v1: "face present" only, or full directional guidance from day one.
- Whether to request a backend change to reduce per-attempt audit-log writes.
- Retry limit: is **try again** unlimited, or capped (e.g. nudge toward submit-anyway /
  contact after N attempts) to avoid an unbounded frustration loop?
