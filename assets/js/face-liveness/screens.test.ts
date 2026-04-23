import { screenForLivenessError, determineFailScreen } from './screens'

describe('screenForLivenessError', () => {
  it.each([
    ['TIMEOUT', 'timeout'],
    ['CONNECTION_TIMEOUT', 'connectionTimeout'],
    ['CAMERA_ACCESS_ERROR', 'cameraError'],
    ['DEFAULT_CAMERA_NOT_FOUND_ERROR', 'cameraError'],
    ['CAMERA_FRAMERATE_ERROR', 'cameraFramerate'],
    ['MULTIPLE_FACES_ERROR', 'multipleFaces'],
    ['MOBILE_LANDSCAPE_ERROR', 'landscape'],
  ])('maps %s to the %s screen', (state, expected) => {
    expect(screenForLivenessError(state)).toBe(expected)
  })

  it.each([
    ['RUNTIME_ERROR'],
    ['SERVER_ERROR'],
    ['FRESHNESS_TIMEOUT'],
    ['FACE_DISTANCE_ERROR'],
    ['SOMETHING_UNEXPECTED'],
    [''],
  ])('falls back to the generic error screen for unhandled state %s', state => {
    expect(screenForLivenessError(state)).toBe('error')
  })

  it('falls back to the generic error screen when state is undefined', () => {
    expect(screenForLivenessError(undefined)).toBe('error')
  })
})

describe('determineFailScreen', () => {
  it.each<[boolean | undefined, string | undefined, string]>([
    [true, 'MATCH', 'match'],
    [false, 'MATCH', 'notLiveMatch'],
    [true, 'NO_MATCH', 'liveNoMatch'],
    [false, 'NO_MATCH', 'notLiveNoMatch'],
  ])('maps isLive=%s result=%s to %s', (isLive, result, expected) => {
    expect(determineFailScreen(isLive, result)).toBe(expected)
  })

  it.each<[boolean | undefined, string | undefined]>([
    [true, undefined],
    [true, 'UNKNOWN'],
    [undefined, undefined],
  ])('falls back to error for isLive=%s result=%s', (isLive, result) => {
    expect(determineFailScreen(isLive, result)).toBe('error')
  })
})
