// MediaPipe-backed FaceGate. Runs the blaze_face_short_range detector entirely on-device
// (WASM/WebGL) — no frames leave the browser for positioning, which is both a privacy win
// and what keeps Rekognition cost down (we only verify once the user is centred).
//
// Assets are self-hosted under /assets/mediapipe (vendored by the esbuild asset step), not
// pulled from a CDN. See docs/fallback-continuous-verify-implementation.md.

import { FaceDetector, FilesetResolver } from '@mediapipe/tasks-vision'
import { assessFrame, DEFAULT_TUNABLES, FaceGate, GateTunables } from './face-gate'

const WASM_BASE = '/assets/mediapipe/wasm'
const MODEL_URL = '/assets/mediapipe/blaze_face_short_range.tflite'
const DEFAULT_STABLE_MS = 600

export interface MediaPipeGateOptions {
  // Mirror the horizontal guidance for a selfie-style preview (default true).
  mirrored?: boolean
  tunables?: GateTunables
  // How long the face must stay within tolerance before we report `centred`.
  stableMs?: number
  // GPU is faster where supported; CPU is the safe fallback.
  delegate?: 'GPU' | 'CPU'
}

export function createMediaPipeGate(options: MediaPipeGateOptions = {}): FaceGate {
  const mirrored = options.mirrored ?? true
  const tunables = options.tunables ?? DEFAULT_TUNABLES
  const stableMs = options.stableMs ?? DEFAULT_STABLE_MS
  const delegate = options.delegate ?? 'GPU'

  let detector: FaceDetector | null = null
  let rafId = 0
  let running = false
  let withinSince = 0

  return {
    async start(video, onSample) {
      const vision = await FilesetResolver.forVisionTasks(WASM_BASE)
      detector = await FaceDetector.createFromOptions(vision, {
        baseOptions: { modelAssetPath: MODEL_URL, delegate },
        runningMode: 'VIDEO',
      })
      running = true

      const loop = () => {
        if (!running || !detector) return

        const ts = performance.now()
        const { detections } = detector.detectForVideo(video, ts)
        const b = detections[0]?.boundingBox ?? null
        const box = b ? { originX: b.originX, originY: b.originY, width: b.width, height: b.height } : null

        const assessment = assessFrame(box, video.videoWidth, video.videoHeight, mirrored, tunables)

        // Layer the stability hold on top of the pure per-frame assessment. More than one
        // face in frame must never verify — tell the user to be alone instead.
        let centred = false
        let { guidance } = assessment
        if (detections.length > 1) {
          guidance = 'MULTIPLE_FACES'
          withinSince = 0
        } else if (assessment.withinTolerance) {
          if (!withinSince) withinSince = ts
          centred = ts - withinSince >= stableMs
        } else {
          withinSince = 0
        }

        onSample({ present: assessment.present, centred, guidance })
        rafId = requestAnimationFrame(loop)
      }

      rafId = requestAnimationFrame(loop)
    },

    stop() {
      running = false
      if (rafId) cancelAnimationFrame(rafId)
      detector?.close()
      detector = null
      withinSince = 0
    },
  }
}
