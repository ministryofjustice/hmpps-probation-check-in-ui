import initFallbackVideo from './face-liveness/fallback-video'

const SCREEN_TO_PARTIAL: Record<string, string> = {
  fallbackRecording: 'fallbackRecordingScreen',
  fallbackMatch: 'fallbackMatchScreen',
  fallbackTimeoutNoMatch: 'fallbackTimeoutNoMatchScreen',
  fallbackTimeoutNoFace: 'fallbackTimeoutNoFaceScreen',
  fallbackError: 'fallbackErrorScreen',
}

const FALLBACK_PARTIAL_IDS = Object.values(SCREEN_TO_PARTIAL)
const TIMEOUT_SCREENS = ['fallbackTimeoutNoMatch', 'fallbackTimeoutNoFace']

function showPartial(id: string) {
  FALLBACK_PARTIAL_IDS.forEach(partialId => {
    const el = document.getElementById(partialId)
    if (el) {
      const shouldShow = partialId === id
      el.hidden = !shouldShow
      el.ariaHidden = String(!shouldShow)
    }
  })
}

function getSubmissionId(): string {
  const match = window.location.pathname.match(/^\/([^/]+)/)
  return match ? match[1] : ''
}

function getCsrfToken(): string {
  return document.querySelector<HTMLInputElement>('input[name=_csrf]')?.value ?? ''
}

const submissionId = getSubmissionId()
const messages = document.getElementById('fallbackMessages')
const maxRetries = Number(messages?.dataset.maxRetries ?? '3')

let attempts = 0

// After maxRetries timeouts, stop offering "try again" and steer the user to submit-anyway
// / contacting their probation officer, so they are never trapped in an unbounded loop.
function setHidden(el: HTMLElement, hidden: boolean) {
  const target = el
  target.hidden = hidden
  target.ariaHidden = String(hidden)
}

function applyRetryCap() {
  if (attempts < maxRetries) return
  document.querySelectorAll<HTMLElement>('[data-fallback-retry]').forEach(el => setHidden(el, true))
  document.querySelectorAll<HTMLElement>('[data-fallback-capped]').forEach(el => setHidden(el, false))
}

function setScreen(screen: string) {
  const partialId = SCREEN_TO_PARTIAL[screen]
  if (!partialId) return
  showPartial(partialId)
  if (TIMEOUT_SCREENS.includes(screen)) applyRetryCap()
}

function startJourney() {
  initFallbackVideo(submissionId, getCsrfToken(), setScreen)
}

startJourney()

document.addEventListener('click', e => {
  const target = e.target as HTMLElement
  if (target.closest('[data-fallback-retry]')) {
    e.preventDefault()
    attempts += 1
    showPartial('fallbackRecordingScreen')
    startJourney()
  }
})
