import React, { useState, useCallback, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { FaceLivenessDetectorCore } from '@aws-amplify/ui-react-liveness'
import '@aws-amplify/ui-react-liveness/styles.css'

interface VerifyResult {
  status: string
  result?: string
  isLive?: boolean
  message?: string
}

type Screen =
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
  | 'fallbackRecording'
  | 'fallbackLoading'
  | 'fallbackMatch'
  | 'fallbackNoMatch'
  | 'fallbackError'

const PARTIAL_IDS = [
  'loadingScreen',
  'matchScreen',
  'notLiveMatchScreen',
  'liveNoMatchScreen',
  'notLiveNoMatchScreen',
  'timeoutScreen',
  'cameraErrorScreen',
  'errorScreen',
  'fallbackRecordingScreen',
  'fallbackLoadingScreen',
  'fallbackMatchScreen',
  'fallbackNoMatchScreen',
  'fallbackErrorScreen',
]

const SCREEN_TO_PARTIAL: Record<string, string> = {
  loading: 'loadingScreen',
  match: 'matchScreen',
  notLiveMatch: 'notLiveMatchScreen',
  liveNoMatch: 'liveNoMatchScreen',
  notLiveNoMatch: 'notLiveNoMatchScreen',
  timeout: 'timeoutScreen',
  cameraError: 'cameraErrorScreen',
  error: 'errorScreen',
  fallbackRecording: 'fallbackRecordingScreen',
  fallbackLoading: 'fallbackLoadingScreen',
  fallbackMatch: 'fallbackMatchScreen',
  fallbackNoMatch: 'fallbackNoMatchScreen',
  fallbackError: 'fallbackErrorScreen',
}

function getDataAttribute(name: string): string {
  const root = document.getElementById('face-liveness-root')
  return root?.dataset[name] || ''
}

async function fetchCredentials(submissionId: string) {
  const res = await fetch(`/${submissionId}/liveness/credentials`)
  if (!res.ok) throw new Error('Failed to fetch credentials')
  return res.json()
}

async function fetchNewSession(submissionId: string): Promise<string> {
  const res = await fetch(`/${submissionId}/liveness/session`)
  if (!res.ok) throw new Error('Failed to create liveness session')
  const data = await res.json()
  return data.sessionId
}

async function fetchVerifyResult(submissionId: string, sessionId: string): Promise<VerifyResult> {
  const res = await fetch(`/${submissionId}/liveness/verify?sessionId=${encodeURIComponent(sessionId)}`)
  if (!res.ok) throw new Error('Verification request failed')
  return res.json()
}

async function fetchSnapshotUploadUrl(submissionId: string): Promise<string> {
  const res = await fetch(`/${submissionId}/liveness/upload-url`)
  if (!res.ok) throw new Error('Failed to get upload URL')
  const data = await res.json()
  if (data.status === 'ERROR') throw new Error(data.message)
  return data.url
}

async function uploadSnapshot(url: string, blob: Blob): Promise<void> {
  const res = await fetch(url, {
    method: 'PUT',
    body: blob,
    headers: { 'Content-Type': blob.type },
  })
  if (!res.ok) throw new Error('Snapshot upload failed')
}

async function fetchVideoVerifyResult(submissionId: string): Promise<string> {
  const res = await fetch(`/${submissionId}/video/verify`)
  if (!res.ok) throw new Error('Video verification request failed')
  const data = await res.json()
  if (data.status === 'SUCCESS') return data.result
  throw new Error(data.message || 'Unable to verify photo')
}

function showNunjucksPartial(id: string) {
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

function hideAllPartials() {
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

function determineFailScreen(isLive: boolean | undefined, result: string | undefined): Screen {
  if (isLive && result === 'MATCH') return 'match'
  if (!isLive && result === 'MATCH') return 'notLiveMatch'
  if (isLive && result === 'NO_MATCH') return 'liveNoMatch'
  if (!isLive && result === 'NO_MATCH') return 'notLiveNoMatch'
  return 'error'
}

// Fallback video recorder
const COUNTDOWN_TIME = 3000
const SCREENSHOT_TIME = 2000
const RECORDING_TIME = 5000
const LOADING_SCREEN_DELAY = 3000

async function initFallbackVideo(submissionId: string, setScreen: (screen: Screen) => void) {
  const video = document.getElementById('fallbackVideo') as HTMLVideoElement
  const canvas = document.getElementById('fallbackCanvas') as HTMLCanvasElement
  const startBtn = document.getElementById('fallbackStartBtn') as HTMLButtonElement
  const statusTag = document.getElementById('fallbackStatusTag') as HTMLElement
  const videoContainer = document.getElementById('fallbackVideoContainer') as HTMLElement
  const cameraError = document.getElementById('fallbackCameraError') as HTMLElement

  if (!video || !startBtn) return

  let screenshotBlob: Blob | null = null

  try {
    const w = 480
    const h = 640
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        advanced: [
          { height: w, width: h, aspectRatio: Math.round((h / w) * 100) / 100 },
          { height: h, width: w, aspectRatio: Math.round((w / h) * 100) / 100 },
        ],
      },
      audio: false,
    })
    video.srcObject = stream
    startBtn.disabled = false
    startBtn.ariaDisabled = 'false'
  } catch {
    videoContainer.hidden = true
    videoContainer.ariaHidden = 'true'
    cameraError.hidden = false
    cameraError.ariaHidden = 'false'
    return
  }

  function captureScreenshot() {
    const ctx = canvas.getContext('2d')!
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    canvas.toBlob(blob => {
      screenshotBlob = blob
    }, 'image/jpeg')
  }

  async function handleRecordingComplete() {
    setScreen('fallbackLoading')
    const startTime = Date.now()

    try {
      const uploadUrl = await fetchSnapshotUploadUrl(submissionId)
      if (!screenshotBlob) throw new Error('No screenshot captured')
      await uploadSnapshot(uploadUrl, screenshotBlob)
      const result = await fetchVideoVerifyResult(submissionId)

      const elapsed = Date.now() - startTime
      const delay = Math.max(0, LOADING_SCREEN_DELAY - elapsed)

      setTimeout(() => {
        if (result === 'MATCH') {
          setScreen('fallbackMatch')
        } else {
          setScreen('fallbackNoMatch')
        }
      }, delay)
    } catch {
      setScreen('fallbackError')
    }
  }

  startBtn.addEventListener('click', () => {
    startBtn.disabled = true
    startBtn.ariaDisabled = 'true'
    statusTag.style.display = 'flex'
    statusTag.ariaLive = 'polite'

    video.scrollIntoView({ behavior: 'smooth', block: 'center' })

    let countdown = COUNTDOWN_TIME / 1000
    statusTag.textContent = `We will start recording in ${countdown} seconds`
    const countdownInterval = setInterval(() => {
      countdown -= 1
      if (countdown > 0) {
        statusTag.textContent = `We will start recording in ${countdown} seconds`
      }
    }, 1000)

    setTimeout(() => {
      clearInterval(countdownInterval)

      statusTag.classList.add('status--recording')
      statusTag.textContent = `Recording: ${RECORDING_TIME / 1000} seconds left`

      // Capture screenshot at 2s
      setTimeout(captureScreenshot, SCREENSHOT_TIME)

      // Countdown tag
      let seconds = RECORDING_TIME / 1000
      const interval = setInterval(() => {
        seconds -= 1
        if (seconds > 0) {
          statusTag.textContent = `Recording: ${seconds} second${seconds === 1 ? '' : 's'} left`
        } else {
          statusTag.ariaLive = 'off'
          clearInterval(interval)
        }
      }, 1000)

      // Stop after 5s
      setTimeout(() => {
        // Stop the camera stream
        const stream = video.srcObject as MediaStream
        if (stream) {
          stream.getTracks().forEach(track => track.stop())
        }
        handleRecordingComplete()
      }, RECORDING_TIME)
    }, COUNTDOWN_TIME)
  })
}

let mountCount = 0

function FaceLivenessApp({ attempt }: { attempt: number }) {
  const submissionId = getDataAttribute('submissionId')
  const region = getDataAttribute('region') || 'eu-west-1'
  const initialSessionId = getDataAttribute('sessionId')

  const [sessionId, setSessionId] = useState<string | null>(attempt === 0 ? initialSessionId : null)
  const [screen, setScreen] = useState<Screen>(attempt === 0 ? 'liveness' : 'initialising')

  // For retries, fetch a new session on mount
  useEffect(() => {
    if (attempt > 0) {
      fetchNewSession(submissionId)
        .then(newId => {
          setSessionId(newId)
          setScreen('liveness')
        })
        .catch(() => {
          setScreen('error')
        })
    }
  }, [attempt, submissionId])

  const credentialProvider = useCallback(async () => {
    const creds = await fetchCredentials(submissionId)
    return {
      accessKeyId: creds.accessKeyId,
      secretAccessKey: creds.secretAccessKey,
      sessionToken: creds.sessionToken,
      expiration: new Date(creds.expiration),
    }
  }, [submissionId])

  const handleAnalysisComplete = useCallback(async () => {
    setScreen('loading')
    try {
      const result = await fetchVerifyResult(submissionId, sessionId!)
      if (result.status === 'SUCCESS') {
        setScreen(determineFailScreen(result.isLive, result.result))
      } else {
        setScreen('error')
      }
    } catch {
      setScreen('error')
    }
  }, [submissionId, sessionId])

  const handleError = useCallback((livenessError?: { state?: string }) => {
    if (livenessError?.state === 'TIMEOUT') {
      setScreen('timeout')
    } else if (livenessError?.state === 'CAMERA_ACCESS_ERROR') {
      setScreen('cameraError')
    } else {
      setScreen('error')
    }
  }, [])

  useEffect(() => {
    const partialId = SCREEN_TO_PARTIAL[screen]
    if (partialId) {
      showNunjucksPartial(partialId)
    }
  }, [screen])

  useEffect(() => {
    if (screen === 'fallbackRecording') {
      initFallbackVideo(submissionId, setScreen)
    }
  }, [screen, submissionId])

  if (screen === 'initialising') {
    return (
      <div className="es-loader">
        <div className="es-loader__spinner" aria-live="polite" role="status"></div>
        <div className="es-loader__content">
          <h1 className="govuk-heading-m">Preparing liveness check</h1>
        </div>
      </div>
    )
  }

  if (screen !== 'liveness' || !sessionId) {
    return null
  }

  return (
    <FaceLivenessDetectorCore
      sessionId={sessionId}
      region={region}
      onAnalysisComplete={handleAnalysisComplete}
      onError={handleError}
      onUserCancel={() => handleError()}
      config={{
        credentialProvider,
      }}
      displayText={{
        photosensitivityWarningHeadingText: 'Your custom heading',
        photosensitivityWarningBodyText: 'Your custom body text',
        photosensitivityWarningInfoText: 'Your custom info text',
        photosensitivityWarningLabelText: 'Your custom label text',
        startScreenBeginCheckText: "Start identity check",
        hintCenterFaceText: 'Centre your face',
        hintCenterFaceInstructionText: 'Centre face instruction text',
        recordingIndicatorText: 'Recording now',
      }}
    />
  )
}

// Mount the React app
const container = document.getElementById('face-liveness-root')
if (container) {
  const root = createRoot(container)

  function renderApp() {
    const attempt = mountCount++
    root.render(<FaceLivenessApp attempt={attempt} />)
    container!.style.display = 'block'
    hideAllPartials()
  }

  renderApp()

  // Wire up retry buttons in the Nunjucks partials
  document.addEventListener('click', e => {
    const target = e.target as HTMLElement

    if (target.closest('[data-liveness-retry]')) {
      e.preventDefault()
      renderApp()
    }

    if (target.closest('[data-fallback-video]')) {
      e.preventDefault()
      showNunjucksPartial('fallbackRecordingScreen')
      const submissionId = getDataAttribute('submissionId')
      initFallbackVideo(submissionId, (screen: Screen) => {
        const partialId = SCREEN_TO_PARTIAL[screen]
        if (partialId) showNunjucksPartial(partialId)
      })
    }
  })
}
