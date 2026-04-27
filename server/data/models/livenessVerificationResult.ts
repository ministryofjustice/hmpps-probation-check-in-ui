import AutomatedIdVerificationResult from './automatedIdVerificationResult'

export default interface LivenessVerificationResult {
  isLive: boolean
  livenessConfidence: number
  result: AutomatedIdVerificationResult
}
