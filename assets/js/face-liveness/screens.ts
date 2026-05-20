type Outcome =
  | 'match'
  | 'not-live-match'
  | 'live-no-match'
  | 'not-live-no-match'
  | 'timeout'
  | 'connection-timeout'
  | 'camera-error'
  | 'camera-framerate'
  | 'multiple-faces'
  | 'landscape'
  | 'cancelled'
  | 'error'

export function determineFailOutcome(isLive: boolean | undefined, result: string | undefined): Outcome {
  if (isLive && result === 'MATCH') return 'match'
  if (!isLive && result === 'MATCH') return 'not-live-match'
  if (isLive && result === 'NO_MATCH') return 'live-no-match'
  if (!isLive && result === 'NO_MATCH') return 'not-live-no-match'
  return 'error'
}

export function outcomeForLivenessError(state: string | undefined): Outcome {
  switch (state) {
    case 'TIMEOUT':
      return 'timeout'
    case 'CONNECTION_TIMEOUT':
      return 'connection-timeout'
    case 'CAMERA_ACCESS_ERROR':
    case 'DEFAULT_CAMERA_NOT_FOUND_ERROR':
      return 'camera-error'
    case 'CAMERA_FRAMERATE_ERROR':
      return 'camera-framerate'
    case 'MULTIPLE_FACES_ERROR':
      return 'multiple-faces'
    case 'MOBILE_LANDSCAPE_ERROR':
      return 'landscape'
    default:
      return 'error'
  }
}

export function navigateToOutcome(submissionId: string, outcome: Outcome): void {
  window.location.href = `/${submissionId}/liveness/outcome/${outcome}`
}

export function showLoading(): void {
  const reactRoot = document.getElementById('face-liveness-root')
  if (reactRoot) reactRoot.style.display = 'none'
  const instructions = document.getElementById('instructionsScreen')
  if (instructions) {
    instructions.hidden = true
    instructions.ariaHidden = 'true'
  }
  const loading = document.getElementById('loadingScreen')
  if (loading) {
    loading.hidden = false
    loading.ariaHidden = 'false'
  }
}
