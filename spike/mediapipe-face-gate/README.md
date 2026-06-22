# Spike — MediaPipe face-centring gate

Throwaway prototype for workstream **B** in
[`docs/fallback-continuous-verify-plan.md`](../../docs/fallback-continuous-verify-plan.md).
It is **not** wired into the app or the esbuild build — it's a single static HTML page
you open directly. Delete the `spike/` directory once we've made the build/no-build call.

## What it proves

1. **Detection works on a real device** — live `getUserMedia` → MediaPipe `FaceDetector`
   (`blaze_face_short_range`), bounding box drawn over the video.
2. **Usable frame rate** — rolling detect FPS shown; GPU/CPU delegate toggle to compare.
3. **Stable directional guidance** — box-centre vs frame-centre → "move left/right/up/down/
   closer/back", with a dead-zone and a 600 ms stability hold before it would "capture".
   The green border pulse = the moment we'd grab a frame and call Rekognition.
4. **Asset size for the self-hosting / CSP decision** — load it with DevTools → Network
   open and record the `.wasm` and `.tflite` download sizes (see below).
5. **Bonus: accessible announcements** — a throttled `aria-live` region (one announcement
   per 1.5 s, only on change). Turn on VoiceOver/TalkBack and confirm it doesn't chatter.

## Run it on a laptop (quickest first check)

`getUserMedia` needs a secure context. `localhost` counts as secure, so any static server works:

```sh
npx serve spike/mediapipe-face-gate -l 8080
# open http://localhost:8080 in Chrome/Safari, click "Start camera"
```

## Run it on a phone (the real test)

A phone hitting your laptop's LAN IP is **not** a secure context, so the camera is blocked.
Expose the local server over HTTPS with a tunnel and open the tunnel URL on the phone:

```sh
npx serve spike/mediapipe-face-gate -l 8080        # terminal 1
npx cloudflared tunnel --url http://localhost:8080  # terminal 2 → prints an https URL
# (ngrok http 8080 works just as well)
```

Test on the **actual device profile our users have**, not just a flagship. Try iOS Safari
*and* Android Chrome, in poor and good lighting.

## What to record (spike output)

- Model-load time and time-to-first-detection (shown on the page).
- Detect FPS on GPU vs CPU on each test device.
- `.wasm` + `.tflite` total transfer size (DevTools → Network; use remote debugging for the
  phone: Safari Web Inspector for iOS, `chrome://inspect` for Android).
- Subjective: does the guidance feel stable or jittery? Is the **mirror** convention right
  (does "move right" match what the user does)? Toggle "Mirror preview" to compare.
- Whether the 600 ms hold + dead-zone feel right for a VI user, or need tuning.

## Exit criteria (from the plan)

Pass if, on a target device: detection tracks a face at a usable frame rate, total assets
are an acceptable download, the assets can be self-hosted under our CSP, and the direction
signal is stable enough to gate on. **If any fail**, fall back to a crude "face present
(yes/no)" gate — that still delivers workstream A's cost control.

## Production follow-ups (deliberately skipped here)

- **Self-host the assets.** This spike pulls the WASM fileset from jsDelivr and the model
  from Google storage for speed. In production we vendor both under `assets/` and serve
  them ourselves (no third-party CDN for a gov service).
- **CSP.** Self-hosted MediaPipe typically needs `script-src 'wasm-unsafe-eval'` (WASM
  compile) and may need `worker-src`/`child-src 'self' blob:`. Confirm against our current
  policy when integrating; this standalone page has no CSP so it can't tell us this — it's
  a build-time check.
- **Tunables** (`DEADZONE`, `SIZE_MIN/MAX`, `STABLE_MS`, throttle) live at the top of
  `index.html`; carry the validated values into the real `face-gate` module.
