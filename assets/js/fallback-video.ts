import initFallbackVideo from './face-liveness/fallback-video'

const FALLBACK_PARTIAL_IDS = [
  'fallbackRecordingScreen',
  'fallbackReviewScreen',
  'fallbackLoadingScreen',
  'fallbackMatchScreen',
  'fallbackNoMatchScreen',
  'fallbackErrorScreen',
]

const SCREEN_TO_PARTIAL: Record<string, string> = {
  fallbackRecording: 'fallbackRecordingScreen',
  fallbackReview: 'fallbackReviewScreen',
  fallbackLoading: 'fallbackLoadingScreen',
  fallbackMatch: 'fallbackMatchScreen',
  fallbackNoMatch: 'fallbackNoMatchScreen',
  fallbackError: 'fallbackErrorScreen',
}

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
  const path = window.location.pathname
  const match = path.match(/^\/([^/]+)/)
  return match ? match[1] : ''
}

function getCsrfToken(): string {
  return document.querySelector<HTMLInputElement>('input[name=_csrf]')?.value ?? ''
}

const submissionId = getSubmissionId()
const csrfToken = getCsrfToken()

initFallbackVideo(submissionId, csrfToken, (screen: string) => {
  const partialId = SCREEN_TO_PARTIAL[screen]
  if (partialId) showPartial(partialId)
})

// Wire up retry buttons
document.addEventListener('click', e => {
  const target = e.target as HTMLElement
  if (target.closest('[data-fallback-video]')) {
    e.preventDefault()
    showPartial('fallbackRecordingScreen')
    initFallbackVideo(submissionId, csrfToken, (screen: string) => {
      const partialId = SCREEN_TO_PARTIAL[screen]
      if (partialId) showPartial(partialId)
    })
  }
})
