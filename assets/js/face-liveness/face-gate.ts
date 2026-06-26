// A "face gate" watches a live camera feed and reports, frame by frame, whether the user's
// face is present and well-positioned for an identity snapshot. The continuous fallback
// verify loop uses it to decide when to spend a Rekognition comparison, and to drive the
// positioning guidance shown to the user (especially screen-reader users).
//
// Guidance is emitted as a semantic CODE, never display text: the presentation layer maps
// codes to localised (English/Welsh) strings. This keeps the geometry pure and testable,
// and keeps translation out of the bundle.

export type GuidanceCode =
  | 'NO_FACE'
  | 'MULTIPLE_FACES'
  | 'MOVE_LEFT'
  | 'MOVE_RIGHT'
  | 'MOVE_UP'
  | 'MOVE_DOWN'
  | 'MOVE_CLOSER'
  | 'MOVE_BACK'

export interface GateSample {
  // A face is detected at all.
  present: boolean
  // Face is within position + size tolerance AND has held there long enough to be stable.
  // This is the signal the verify loop gates on.
  centred: boolean
  // The single most useful nudge when not yet centred; null once centred.
  guidance: GuidanceCode | null
}

export interface FaceGate {
  start(video: HTMLVideoElement, onSample: (sample: GateSample) => void): Promise<void>
  stop(): void
}

// Pixel bounding box in the video's intrinsic coordinate space (origin top-left).
export interface BoundingBox {
  originX: number
  originY: number
  width: number
  height: number
}

export interface GateTunables {
  // Half-width of the centred dead-zone, as a fraction of the frame (0..0.5).
  deadzone: number
  // Acceptable face height as a fraction of frame height.
  sizeMin: number
  sizeMax: number
}

// Validated in spike/mediapipe-face-gate on a real device.
export const DEFAULT_TUNABLES: GateTunables = { deadzone: 0.12, sizeMin: 0.3, sizeMax: 0.62 }

export interface FrameAssessment {
  present: boolean
  // Position + size are acceptable for THIS frame (before the stability hold is applied).
  withinTolerance: boolean
  guidance: GuidanceCode | null
}

/**
 * Pure, stateless assessment of a single detected face against the centring tolerances.
 * The stability hold (must stay within tolerance for N ms) is layered on by the gate.
 *
 * `mirrored` mirrors the validated spike convention: when the preview is shown as a
 * mirror (the default selfie view), horizontal guidance is flipped so "move right" means
 * the user's right.
 */
export function assessFrame(
  box: BoundingBox | null,
  frameWidth: number,
  frameHeight: number,
  mirrored: boolean,
  tunables: GateTunables = DEFAULT_TUNABLES,
): FrameAssessment {
  if (!box || frameWidth <= 0 || frameHeight <= 0) {
    return { present: false, withinTolerance: false, guidance: 'NO_FACE' }
  }

  const { deadzone, sizeMin, sizeMax } = tunables
  const cx = (box.originX + box.width / 2) / frameWidth - 0.5
  const cy = (box.originY + box.height / 2) / frameHeight - 0.5
  const size = box.height / frameHeight
  const dxUser = mirrored ? -cx : cx

  // Each axis out of tolerance contributes a candidate nudge with a magnitude; we surface
  // only the worst one. A single instruction at a time is far easier to act on than a
  // compound "move left, down and closer" — especially via a screen reader.
  const candidates: Array<{ code: GuidanceCode; magnitude: number }> = []

  if (dxUser < -deadzone) candidates.push({ code: 'MOVE_RIGHT', magnitude: -dxUser })
  else if (dxUser > deadzone) candidates.push({ code: 'MOVE_LEFT', magnitude: dxUser })

  if (cy < -deadzone) candidates.push({ code: 'MOVE_DOWN', magnitude: -cy })
  else if (cy > deadzone) candidates.push({ code: 'MOVE_UP', magnitude: cy })

  if (size < sizeMin) candidates.push({ code: 'MOVE_CLOSER', magnitude: (sizeMin - size) / sizeMin })
  else if (size > sizeMax) candidates.push({ code: 'MOVE_BACK', magnitude: (size - sizeMax) / sizeMax })

  if (candidates.length === 0) {
    return { present: true, withinTolerance: true, guidance: null }
  }

  const worst = candidates.reduce((a, b) => (b.magnitude > a.magnitude ? b : a))
  return { present: true, withinTolerance: false, guidance: worst.code }
}

/**
 * Graceful-degradation gate used when the MediaPipe model cannot be loaded on a device.
 * It reports "centred" on a fixed interval so the verify loop degrades to periodic
 * verification (loses the cost-saving gate, keeps the function). It never emits guidance,
 * so the loop falls back to generic "looking for you" messaging.
 */
export function createNullGate(intervalMs = 3000): FaceGate {
  let timer: ReturnType<typeof setInterval> | null = null
  return {
    async start(_video, onSample) {
      timer = setInterval(() => onSample({ present: true, centred: true, guidance: null }), intervalMs)
    },
    stop() {
      if (timer) clearInterval(timer)
      timer = null
    },
  }
}
