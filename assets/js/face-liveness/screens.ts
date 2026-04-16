export type Screen =
  | 'initialising'
  | 'liveness'
  | 'loading'
  | 'match'
  | 'notLiveMatch'
  | 'liveNoMatch'
  | 'notLiveNoMatch'
  | 'timeout'
  | 'cameraError'
  | 'error'

const PARTIAL_IDS = [
  'loadingScreen',
  'matchScreen',
  'notLiveMatchScreen',
  'liveNoMatchScreen',
  'notLiveNoMatchScreen',
  'timeoutScreen',
  'cameraErrorScreen',
  'errorScreen',
]

export const SCREEN_TO_PARTIAL: Record<string, string> = {
  loading: 'loadingScreen',
  match: 'matchScreen',
  notLiveMatch: 'notLiveMatchScreen',
  liveNoMatch: 'liveNoMatchScreen',
  notLiveNoMatch: 'notLiveNoMatchScreen',
  timeout: 'timeoutScreen',
  cameraError: 'cameraErrorScreen',
  error: 'errorScreen',
}

export function showNunjucksPartial(id: string) {
  const reactRoot = document.getElementById('face-liveness-root')
  if (reactRoot) reactRoot.style.display = 'none'

  const instructions = document.getElementById('instructionsScreen')
  if (instructions) {
    instructions.hidden = true
    instructions.ariaHidden = 'true'
  }

  PARTIAL_IDS.forEach(partialId => {
    const el = document.getElementById(partialId)
    if (el) {
      const shouldShow = partialId === id
      el.hidden = !shouldShow
      el.ariaHidden = String(!shouldShow)
    }
  })
}

export function hideAllPartials() {
  const instructions = document.getElementById('instructionsScreen')
  if (instructions) {
    instructions.hidden = false
    instructions.ariaHidden = 'false'
  }

  PARTIAL_IDS.forEach(id => {
    const el = document.getElementById(id)
    if (el) {
      el.hidden = true
      el.ariaHidden = 'true'
    }
  })
}

export function determineFailScreen(isLive: boolean | undefined, result: string | undefined): Screen {
  if (isLive && result === 'MATCH') return 'match'
  if (!isLive && result === 'MATCH') return 'notLiveMatch'
  if (isLive && result === 'NO_MATCH') return 'liveNoMatch'
  if (!isLive && result === 'NO_MATCH') return 'notLiveNoMatch'
  return 'error'
}
