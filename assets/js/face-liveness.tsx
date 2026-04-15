import React, { useState, useCallback, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { FaceLivenessDetectorCore } from '@aws-amplify/ui-react-liveness'
import '@aws-amplify/ui-react-liveness/styles.css'

import { fetchCredentials, fetchNewSession, fetchVerifyResult } from './face-liveness/api'
import { type Screen, SCREEN_TO_PARTIAL, showNunjucksPartial, hideAllPartials, determineFailScreen } from './face-liveness/screens'
import initFallbackVideo from './face-liveness/fallback-video'

function getDataAttribute(name: string): string {
  const root = document.getElementById('face-liveness-root')
  return root?.dataset[name] || ''
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
        startScreenBeginCheckText: "Start identity check",
        hintCenterFaceText: 'Centre your face',
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
