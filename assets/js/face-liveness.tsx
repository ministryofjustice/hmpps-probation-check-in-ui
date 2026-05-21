import React, { useCallback, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { FaceLivenessDetectorCore } from '@aws-amplify/ui-react-liveness'
import '@aws-amplify/ui-react-liveness/styles.css'

import { fetchCredentials, fetchVerifyResult, reportClientFailure } from './face-liveness/api'
import { determineFailOutcome, navigateToOutcome, outcomeForLivenessError, showLoading } from './face-liveness/screens'

function getDataAttribute(name: string): string {
  const root = document.getElementById('face-liveness-root')
  return root?.dataset[name] || ''
}

function FaceLivenessApp() {
  const submissionId = getDataAttribute('submissionId')
  const region = getDataAttribute('region') || 'eu-west-1'
  const sessionId = getDataAttribute('sessionId')
  const csrfToken = getDataAttribute('csrfToken')

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
    // Fire-and-forget so the navigation isn't delayed by the network round-trip.
    reportClientFailure(submissionId, livenessError?.state, csrfToken)
    navigateToOutcome(submissionId, outcomeForLivenessError(livenessError?.state))
  }, [submissionId, csrfToken])

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


  const urlParams = new URLSearchParams(window.location.search);
  const isMock = urlParams.get('mock') === 'true';
  if (isMock) {
    return (
      <>
      <div>
        <h3>AWS Rekognition Face Liveness simulations</h3>
        <button data-qa="mock-complete" className="govuk-button"  onClick={handleAnalysisComplete}>Simulate Complete</button>
        <button data-qa="mock-cancel" className="govuk-button govuk-button--secondary"  onClick={handleUserCancel}>Simulate Cancel</button>
      </div>
      <div>

        <button data-qa="mock-timeout" className="govuk-button govuk-button--warning"  onClick={() => handleError({ state: 'TIMEOUT' })}>Mock Timeout Simulation</button>
        <button data-qa="mock-connection-timeout"className="govuk-button govuk-button--warning"  onClick={() => handleError({ state: 'CONNECTION_TIMEOUT' })}>Mock Connection Timeout Simulation</button>
        <button data-qa="mock-default-camera-not-found" className="govuk-button govuk-button--warning"  onClick={() => handleError({ state: 'DEFAULT_CAMERA_NOT_FOUND_ERROR' })}>Mock Default Camera Not Found Error Simulation</button>
        <button data-qa="mock-camera-access" className="govuk-button govuk-button--warning"  onClick={() => handleError({ state: 'CAMERA_ACCESS_ERROR' })}>Mock Camera Access Error Simulation</button>
        <button data-qa="mock-camera-framerate" className="govuk-button govuk-button--warning"  onClick={() => handleError({ state: 'CAMERA_FRAMERATE_ERROR' })}>Mock Camera Framerate Error Simulation</button>
        <button data-qa="mock-multiple-faces" className="govuk-button govuk-button--warning"  onClick={() => handleError({ state: 'MULTIPLE_FACES_ERROR' })}>Mock Multiple Faces Error Simulation</button>
        <button data-qa="mock-mobile-landscape" className="govuk-button govuk-button--warning"  onClick={() => handleError({ state: 'MOBILE_LANDSCAPE_ERROR' })}>Mock Mobile Landscape Error Simulation</button>
        </div>
      </>
    );
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
