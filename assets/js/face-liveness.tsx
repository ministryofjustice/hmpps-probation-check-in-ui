import React, { useCallback, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { FaceLivenessDetectorCore } from '@aws-amplify/ui-react-liveness'
import '@aws-amplify/ui-react-liveness/styles.css'

import { fetchCredentials, fetchVerifyResult } from './face-liveness/api'
import { determineFailOutcome, navigateToOutcome, outcomeForLivenessError, showLoading } from './face-liveness/screens'

function getDataAttribute(name: string): string {
  const root = document.getElementById('face-liveness-root')
  return root?.dataset[name] || ''
}

function FaceLivenessApp() {
  const submissionId = getDataAttribute('submissionId')
  const region = getDataAttribute('region') || 'eu-west-1'
  const sessionId = getDataAttribute('sessionId')

  const [hasStarted, setHasStarted] = useState(false)
  // Once cancelled, ignore any late-firing analysis-complete/error callbacks so they don't
  // overwrite the cancelled-outcome navigation with a generic error page.
  const cancelledRef = useRef(false)

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
    if (cancelledRef.current) return
    showLoading()
    try {
      const result = await fetchVerifyResult(submissionId, sessionId)
      if (cancelledRef.current) return
      if (result.status === 'SUCCESS') {
        navigateToOutcome(submissionId, determineFailOutcome(result.isLive, result.result))
      } else {
        navigateToOutcome(submissionId, 'error')
      }
    } catch {
      if (cancelledRef.current) return
      navigateToOutcome(submissionId, 'error')
    }
  }, [submissionId, sessionId])

  const handleError = useCallback((livenessError?: { state?: string }) => {
    console.error('Face liveness error:', livenessError) // eslint-disable-line no-console
    if (cancelledRef.current) return
    showLoading()
    navigateToOutcome(submissionId, outcomeForLivenessError(livenessError?.state))
  }, [submissionId])

  const handleUserCancel = useCallback(() => {
    cancelledRef.current = true
    navigateToOutcome(submissionId, 'cancelled')
  }, [submissionId])

  // Track when the user clicks Amplify's "Start identity check" button so we can reveal the cancel
  // button only after the start screen is dismissed (avoids a brief flash on initial mount).
  const handleWrapperClick = (e: React.MouseEvent) => {
    if (hasStarted) return
    const target = e.target as HTMLElement
    if (target.closest('.amplify-button--primary')) {
      setHasStarted(true)
    }
  }

  if (!sessionId) return null

  return (
    <div className={`liveness-detector${hasStarted ? ' liveness-detector--started' : ''}`} onClick={handleWrapperClick}>
      <FaceLivenessDetectorCore
        sessionId={sessionId}
        region={region}
        onAnalysisComplete={handleAnalysisComplete}
        onError={handleError}
        onUserCancel={handleUserCancel}
        config={{
          credentialProvider,
        }}
        displayText={{
          startScreenBeginCheckText: 'Start identity check',
          hintCenterFaceText: 'Centre your face',
          recordingIndicatorText: 'Recording',
          cancelLivenessCheckText: 'Cancel identity check',
        }}
      />
    </div>
  )
}

const container = document.getElementById('face-liveness-root')
if (container) {
  const root = createRoot(container)
  root.render(<FaceLivenessApp />)
  container.style.display = 'block'
}
