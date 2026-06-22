# Workstream A — implementation design (continuous verify)

**Status:** Draft for review · depends on
[`fallback-continuous-verify-plan.md`](./fallback-continuous-verify-plan.md).
Spike ([`spike/mediapipe-face-gate/`](../spike/mediapipe-face-gate/)) validated the gate tech.

## Design shift the spike enabled

The "crude gate to ship A early" is **not** a separate non-ML implementation — there's no
reliable face-present signal in the browser without a model. Instead we build **one** gate
(MediaPipe) behind a small interface, and:

- **A (now):** consume only `present` / `centred`; ignore `guidance`.
- **B (fast-follow):** surface `guidance` visually + via throttled announcements.
- **Resilience:** if the model fails to load on a device, swap in a `NullGate` that reports
  `centred` every tick — the loop degrades to fixed-interval verify (loses cost control,
  keeps function).

## Build status

- ✅ **Gate keystone built & verified.** `face-gate.ts` (interface + pure `assessFrame` +
  `NullGate`, 12 unit tests), `mediapipe-gate.ts` (MediaPipe impl, bundles clean).
  `@mediapipe/tasks-vision@0.10.18` added; `blaze_face_short_range.tflite` vendored under
  `assets/mediapipe/`; esbuild copies WASM + model to `dist/assets/mediapipe`; CSP updated
  (`wasm-unsafe-eval`, `blob:`, `worker-src`). `npm run build` + lint + tests pass.
  ⚠️ Guidance is emitted as semantic **codes** — presentation layer must map to en/cy text.
  ⚠️ `package-lock.json` had incidental churn on install — regenerate cleanly in CI.
  ⏳ Not yet runtime-verified that WASM loads under the real CSP — needs the running app.
- ✅ **Loop + UI built.** `fallback-video.ts` rewritten to the gated continuous loop;
  wrapper updated (screen map + retry cap); `record.njk` rewritten (guidance banner,
  checking hint, throttled `aria-live`, config/strings via data-attrs); `review`/`loading`/
  `nomatch` partials removed; `timeout-no-match` + `timeout-no-face` added; en strings +
  guidance-code→text done; cy mirrored with `[CY]` placeholders (fallbackLng=en covers
  them) — **Welsh translation still required**; config `fallbackVerify.{timeoutMs,maxRetries}`
  added + threaded via controller. Build, typecheck, lint, 110 jest tests all pass.
- ⏳ **Next:** runtime-verify in the app (WASM under CSP, end-to-end match), update Cypress
  (`integration_tests/e2e/submission/liveness.cy.ts` still drives the old record/review
  flow), complete Welsh, on-device QA of guidance + screen-reader announcements.

## The gate interface

```ts
// assets/js/face-liveness/face-gate.ts
export interface GateSample {
  present: boolean         // a face is detected at all
  centred: boolean         // present AND within position/size tolerance, held stable
  guidance: string | null  // user-facing nudge when off-centre (B); null in presence-only mode
}

export interface FaceGate {
  start(video: HTMLVideoElement, onSample: (s: GateSample) => void): Promise<void>
  stop(): void
}
```

- `mediapipe-gate.ts` — implements `FaceGate`, carries the validated spike tunables
  (`DEADZONE`, `SIZE_MIN/MAX`, `STABLE_MS`). Self-hosted WASM + `.tflite` (see plan's CSP note).
- `null-gate.ts` — `centred: true` every ~Ns; the graceful-degradation path.

## State machine (replaces record → review → loading → match/nomatch)

```
        ┌─ camera/model error ─────────────► ERROR (terminal)
START ──┤
        └─► SEARCHING ◄──────────────┐
              │ gate.centred + backoff elapsed
              ▼                       │ NO_MATCH
            CHECKING ─────────────────┘
              │ MATCH                 │ ERROR (transient) → SEARCHING (silent retry)
              ▼
            MATCH (terminal)

   wall-clock timeout from SEARCHING/CHECKING ─►
       goodFrameSeen ? TIMEOUT_NO_MATCH : TIMEOUT_NO_FACE   (both terminal)
```

- **SEARCHING** — camera live; show positioning guidance (B) or just "Looking for you" (A).
- **CHECKING** — a verify cycle is in flight; show the **subtle progress hint** (visual
  continuous; SR announced once — see plan). Stays on the same screen as SEARCHING, it's an
  overlay state, not a full page swap.
- `goodFrameSeen` — set true the first time the gate reports `centred`; picks the timeout copy.

## The loop (rewrite of `initFallbackVideo`)

```ts
const TIMEOUT_MS = config.fallbackTimeoutMs  // env-configurable, default 15 min
const MIN_VERIFY_INTERVAL_MS = 3_000         // backoff between Rekognition calls

let verifying = false, matched = false, goodFrameSeen = false, lastVerify = 0
const deadline = Date.now() + TIMEOUT_MS

gate.start(video, async sample => {
  if (matched || Date.now() > deadline) return
  if (sample.centred) goodFrameSeen = true
  showGuidance(sample)                       // B: guidance/hint; A: generic searching text

  const ready = sample.centred && !verifying && Date.now() - lastVerify > MIN_VERIFY_INTERVAL_MS
  if (!ready) return

  verifying = true; lastVerify = Date.now(); setScreen('fallbackChecking')
  try {
    const loc = await fetchSnapshotUploadLocation(submissionId, grabFrame(), csrfToken)
    await uploadSnapshot(loc, ...)
    const result = await fetchVideoVerifyResult(submissionId)   // numSnapshots=1, overwrites index 0
    if (result === 'MATCH') { matched = true; stop(); setScreen('fallbackMatch') }
    // NO_MATCH / NO_FACE_DETECTED: stay in loop, no user-facing failure
  } catch { /* transient ERROR: swallow, keep looping */ }
  finally { verifying = false }
})

setTimeout(() => {
  if (matched) return
  stop()
  setScreen(goodFrameSeen ? 'fallbackTimeoutNoMatch' : 'fallbackTimeoutNoFace')
}, TIMEOUT_MS)
```

`grabFrame()` is today's `captureScreenshot` logic returning the blob. Upload/verify API
functions (`api.ts`) are **unchanged** — already safe to call repeatedly (backend confirmed).

## File-by-file changes

| File | Change |
|---|---|
| `assets/js/face-liveness/face-gate.ts` | **New** — interface + `mediapipe-gate` + `null-gate`. |
| `assets/js/face-liveness/fallback-video.ts` | **Rewrite** to the loop above; drop countdown/review/5s timer; keep `captureScreenshot` as `grabFrame`. |
| `assets/js/fallback-video.ts` | Update `SCREEN_TO_PARTIAL`: remove `fallbackReview`/`fallbackLoading`; add `fallbackChecking` (overlay), `fallbackTimeoutNoFace`, `fallbackTimeoutNoMatch`. |
| `assets/js/face-liveness/api.ts` | **Unchanged.** |
| `views/.../fallback/partials/review.njk` | **Remove** (no manual submit). |
| `views/.../fallback/partials/loading.njk` | **Repurpose** into the in-page checking hint (or remove if folded into record). |
| `views/.../fallback/partials/nomatch.njk` | **Split** into `timeout-no-match.njk` (got good frames; offer try-again + submit-anyway) and `timeout-no-face.njk` (never saw you; lead with try-again + tips, still offer submit-anyway). |
| `views/.../fallback/partials/match.njk`, `error.njk` | **Reuse.** |
| `record.njk` | Add live status/guidance region + checking hint; remove start-button/countdown framing. |
| esbuild config + assets | Vendor MediaPipe WASM/`.tflite`; CSP follow-up. |
| Content (`_en` / `_cy`) | New strings for searching/checking/two timeout messages — **Welsh needed**. |

## Build / verify

- Unit-test the loop's decision logic (gate sample → verify? → screen) by injecting a fake
  `FaceGate` and stubbing the `api.ts` calls — no camera needed.
- Existing Cypress (`integration_tests/e2e/submission/liveness.cy.ts`) will need updating for
  the new screens; camera + MediaPipe can't run in CI, so drive it via a stub gate behind a
  test flag, or assert on the controller/API contract only.

## Decisions (locked)

1. **Timeout:** env-configurable, **default 15 min**. Add a config key (e.g.
   `FALLBACK_VERIFY_TIMEOUT_MS`) surfaced to the client (data-attribute on `record.njk`,
   like `submissionId`/csrf) so no rebuild is needed to tune it.
2. **Fidelity:** **directional guidance ships from day one** — A and B merge into one
   delivery. The gate runs in full guidance mode; accessible announcements are in scope now,
   not a fast-follow. `NullGate` remains the degradation path.
3. **Verify trigger:** **`centred` + stable** (fewest Rekognition calls, best frame quality).
4. **Retry cap:** **cap, then nudge.** Track an attempt counter **in the wrapper**
   (`assets/js/fallback-video.ts`), since each "try again" re-inits the loop. After N
   timeouts (e.g. 3), the timeout screen swaps its primary action to submit-anyway / contact.

## Sequencing impact

With guidance in v1, the old "ship A, then layer B" split is gone — it's a single feature.
Remaining prerequisites before coding: vendor + CSP-check the MediaPipe assets, confirm
`CompareFaces` pricing/limits for the cadence, and agree audit-log handling with the API team.
