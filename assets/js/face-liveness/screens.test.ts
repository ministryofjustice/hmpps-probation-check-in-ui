import { outcomeForLivenessError, determineFailOutcome } from './screens'

describe('outcomeForLivenessError', () => {
  it.each([
    ['TIMEOUT', 'timeout'],
    ['CONNECTION_TIMEOUT', 'connection-timeout'],
    ['CAMERA_ACCESS_ERROR', 'camera-error'],
    ['DEFAULT_CAMERA_NOT_FOUND_ERROR', 'camera-error'],
    ['CAMERA_FRAMERATE_ERROR', 'camera-framerate'],
    ['MULTIPLE_FACES_ERROR', 'multiple-faces'],
    ['MOBILE_LANDSCAPE_ERROR', 'landscape'],
  ])('maps %s to the %s outcome', (state, expected) => {
    expect(outcomeForLivenessError(state)).toBe(expected)
  })

  it.each([
    ['RUNTIME_ERROR'],
    ['SERVER_ERROR'],
    ['FRESHNESS_TIMEOUT'],
    ['FACE_DISTANCE_ERROR'],
    ['SOMETHING_UNEXPECTED'],
    [''],
  ])('falls back to the generic error outcome for unhandled state %s', state => {
    expect(outcomeForLivenessError(state)).toBe('error')
  })

  it('falls back to the generic error outcome when state is undefined', () => {
    expect(outcomeForLivenessError(undefined)).toBe('error')
  })
})

describe('determineFailOutcome', () => {
  it.each<[boolean | undefined, string | undefined, string]>([
    [true, 'MATCH', 'match'],
    [false, 'MATCH', 'not-live-match'],
    [true, 'NO_MATCH', 'live-no-match'],
    [false, 'NO_MATCH', 'not-live-no-match'],
  ])('maps isLive=%s result=%s to %s', (isLive, result, expected) => {
    expect(determineFailOutcome(isLive, result)).toBe(expected)
  })

  it.each<[boolean | undefined, string | undefined]>([
    [true, undefined],
    [true, 'UNKNOWN'],
    [undefined, undefined],
  ])('falls back to error for isLive=%s result=%s', (isLive, result) => {
    expect(determineFailOutcome(isLive, result)).toBe('error')
  })
})
