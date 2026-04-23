import React, { useState, useCallback, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { FaceLivenessDetectorCore } from '@aws-amplify/ui-react-liveness'
import '@aws-amplify/ui-react-liveness/styles.css'

import { fetchCredentials, fetchNewSession, fetchVerifyResult } from './face-liveness/api'
import { type Screen, SCREEN_TO_PARTIAL, showNunjucksPartial, hideAllPartials, determineFailScreen } from './face-liveness/screens'

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
    switch (livenessError?.state) {
      case 'TIMEOUT':
        setScreen('timeout')
        break
      case 'CONNECTION_TIMEOUT':
        setScreen('connectionTimeout')
        break
      case 'CAMERA_ACCESS_ERROR':
      case 'DEFAULT_CAMERA_NOT_FOUND_ERROR':
        setScreen('cameraError')
        break
      case 'CAMERA_FRAMERATE_ERROR':
        setScreen('cameraFramerate')
        break
      case 'MULTIPLE_FACES_ERROR':
        setScreen('multipleFaces')
        break
      case 'MOBILE_LANDSCAPE_ERROR':
        setScreen('landscape')
        break
      default:
        setScreen('error')
    }
  }, [])

  useEffect(() => {
    const partialId = SCREEN_TO_PARTIAL[screen]
    if (partialId) {
      showNunjucksPartial(partialId)
    }
  }, [screen])

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
      onUserCancel={() => setScreen('cancelled')}
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

  // Debug shortcut: press 'f' to skip to fallback inform page
  document.addEventListener('keydown', e => {
    if (e.key === 'f' && !e.ctrlKey && !e.metaKey && !(e.target as HTMLElement).closest('input, textarea')) {
      const submissionId = getDataAttribute('submissionId')
      window.location.href = `/${submissionId}/liveness/fallback-inform`
    }
  })

  // Wire up retry buttons in the Nunjucks partials
  document.addEventListener('click', e => {
    const target = e.target as HTMLElement

    if (target.closest('[data-liveness-retry]')) {
      e.preventDefault()
      renderApp()
    }
  })
}
