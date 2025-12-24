import CheckinStatus from './checkinStatus'
import AutomatedIdVerificationResult from './automatedIdVerificationResult'
import ManualIdVerificationResult from './manualIdVerificationResult'
import SurveyResponse from './survey/surveyResponse'
import { ExternalUserId } from './loggedInUser'

export default interface Checkin {
  uuid: string
  crn: string
  status: CheckinStatus
  dueDate: string
  submittedAt?: string
  questions: string
  surveyResponse?: SurveyResponse
  createdBy: ExternalUserId
  createdAt: string
  reviewedBy?: ExternalUserId
  reviewedAt?: string
  videoUrl?: string
  autoIdCheck?: AutomatedIdVerificationResult
  manualIdCheck?: ManualIdVerificationResult
  flaggedResponses: string[]
  reviewDueDate?: string
  checkinStartedAt?: string
}
