import { assessFrame, BoundingBox, GuidanceCode, DEFAULT_TUNABLES } from './face-gate'

const W = 480
const H = 640

// Build a bounding box from centre fractions (fx, fy) of the frame and a face height
// expressed as a fraction (s) of frame height. Width is irrelevant to the assessment
// beyond locating the centre, so we use a plausible face aspect.
function box(fx: number, fy: number, s: number): BoundingBox {
  const height = s * H
  const width = height * 0.75
  return { originX: fx * W - width / 2, originY: fy * H - height / 2, width, height }
}

describe('assessFrame', () => {
  it('reports NO_FACE when no box is detected', () => {
    expect(assessFrame(null, W, H, true)).toEqual({
      present: false,
      withinTolerance: false,
      guidance: 'NO_FACE',
    })
  })

  it('reports NO_FACE when frame dimensions are not yet known', () => {
    expect(assessFrame(box(0.5, 0.5, 0.45), 0, 0, true).guidance).toBe('NO_FACE')
  })

  it('is within tolerance and gives no guidance when centred and well-sized', () => {
    expect(assessFrame(box(0.5, 0.5, 0.45), W, H, true)).toEqual({
      present: true,
      withinTolerance: true,
      guidance: null,
    })
  })

  it.each<[string, number, number, number, GuidanceCode]>([
    // mirrored preview (default selfie view): horizontal guidance is in the user's frame
    ['face in image-right', 0.8, 0.5, 0.45, 'MOVE_RIGHT'],
    ['face in image-left', 0.2, 0.5, 0.45, 'MOVE_LEFT'],
    ['face too high', 0.5, 0.2, 0.45, 'MOVE_DOWN'],
    ['face too low', 0.5, 0.8, 0.45, 'MOVE_UP'],
    ['face too small', 0.5, 0.5, 0.2, 'MOVE_CLOSER'],
    ['face too large', 0.5, 0.5, 0.7, 'MOVE_BACK'],
  ])('mirrored, %s → expects guidance', (_label, fx, fy, s, expected) => {
    const result = assessFrame(box(fx, fy, s), W, H, true)
    expect(result.present).toBe(true)
    expect(result.withinTolerance).toBe(false)
    expect(result.guidance).toBe(expected)
  })

  it('flips horizontal guidance when the preview is not mirrored', () => {
    // Same image-right face that reads MOVE_RIGHT when mirrored reads MOVE_LEFT raw.
    expect(assessFrame(box(0.8, 0.5, 0.45), W, H, true).guidance).toBe('MOVE_RIGHT')
    expect(assessFrame(box(0.8, 0.5, 0.45), W, H, false).guidance).toBe('MOVE_LEFT')
  })

  it('surfaces only the single worst nudge when several axes are off', () => {
    // Slightly off-centre horizontally (mag ~0.14) but very far back (mag ~0.67):
    // distance dominates, so the user is told the most impactful thing first.
    expect(assessFrame(box(0.64, 0.5, 0.1), W, H, true).guidance).toBe('MOVE_CLOSER')
  })

  it('respects custom tunables', () => {
    // A wide dead-zone tolerates an offset that would otherwise trigger a nudge.
    const wide = { ...DEFAULT_TUNABLES, deadzone: 0.3 }
    expect(assessFrame(box(0.65, 0.5, 0.45), W, H, true, wide).withinTolerance).toBe(true)
  })
})
