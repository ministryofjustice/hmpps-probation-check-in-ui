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

type Screen = 'initialising' | 'liveness' | 'loading' | 'match' | 'noMatch' | 'error'

const PARTIAL_IDS = ['loadingScreen', 'matchScreen', 'noMatchScreen', 'errorScreen']

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
  const res = await fetch(`/${submissionId}/video/verify?sessionId=${encodeURIComponent(sessionId)}`)
  if (!res.ok) throw new Error('Verification request failed')
  return res.json()
}

function showNunjucksPartial(id: string) {
  const reactRoot = document.getElementById('face-liveness-root')
  if (reactRoot) reactRoot.style.display = 'none'

  PARTIAL_IDS.forEach(partialId => {
    const el = document.getElementById(partialId)
    if (el) {
      el.hidden = partialId !== id
      el.ariaHidden = String(partialId !== id)
    }
  })
}

function hideAllPartials() {
  PARTIAL_IDS.forEach(id => {
    const el = document.getElementById(id)
    if (el) {
      el.hidden = true
      el.ariaHidden = 'true'
    }
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
      if (result.status === 'SUCCESS' && result.result === 'MATCH') {
        setScreen('match')
      } else if (result.status === 'SUCCESS') {
        setScreen('noMatch')
      } else {
        setScreen('error')
      }
    } catch {
      setScreen('error')
    }
  }, [submissionId, sessionId])

  const handleError = useCallback(() => {
    setScreen('error')
  }, [])

  useEffect(() => {
    if (screen === 'loading') showNunjucksPartial('loadingScreen')
    else if (screen === 'match') showNunjucksPartial('matchScreen')
    else if (screen === 'noMatch') showNunjucksPartial('noMatchScreen')
    else if (screen === 'error') showNunjucksPartial('errorScreen')
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
      onUserCancel={handleError}
      config={{
        credentialProvider,
      }}
      displayText={{
        photosensitivityWarningHeadingText: 'Your custom heading',
        photosensitivityWarningBodyText: 'Your custom body text',
        photosensitivityWarningInfoText: 'Your custom info text',
        photosensitivityWarningLabelText: 'Your custom label text',
        startScreenBeginCheckText: "Let's do it",
        hintCenterFaceText: 'Centre text',
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
    const retryLink = target.closest('[data-liveness-retry]')
    if (retryLink) {
      e.preventDefault()
      renderApp()
    }
  })
}
