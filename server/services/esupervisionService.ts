import EsupervisionApiClient, { CheckinUploadContentTypes, CheckinUploadHashes } from '../data/esupervisionApiClient'
import Checkin from '../data/models/checkin'
import CheckinSubmission from '../data/models/checkinSubmission'
import CheckinUploadLocationResponse from '../data/models/checkinUploadLocationResponse'
import OffenderCheckinResponse from '../data/models/offenderCheckinResponse'
import AutomaticCheckinVerificationResult from '../data/models/automaticCheckinVerificationResult'
import { CheckinEventType } from '../data/models/checkinEvent'
import Feedback from '../data/models/feedback'
import { OffenderQuestionsResponse } from '../data/models/offenderQuestionsResponse'
import LivenessSession from '../data/models/livenessSession'
import LivenessCredentials from '../data/models/livenessCredentials'
import LivenessVerificationResult from '../data/models/livenessVerificationResult'

export default class EsupervisionService {
  constructor(private readonly esupervisionApiClient: EsupervisionApiClient) {}

  getCheckin(submissionId: string): Promise<OffenderCheckinResponse> {
    return this.esupervisionApiClient.getCheckin(submissionId)
  }

  getCheckinUploadLocation(
    submissionId: string,
    contentTypes: CheckinUploadContentTypes,
    hashes?: CheckinUploadHashes,
  ): Promise<CheckinUploadLocationResponse> {
    return this.esupervisionApiClient.getCheckinUploadLocation(submissionId, contentTypes, hashes)
  }

  submitCheckin(checkinId: string, submission: CheckinSubmission): Promise<Checkin> {
    return this.esupervisionApiClient.submitCheckin(checkinId, submission)
  }

  autoVerifyCheckinIdentity(checkinId: string, numSnapshots: number): Promise<AutomaticCheckinVerificationResult> {
    return this.esupervisionApiClient.autoVerifyCheckinIdentity(checkinId, numSnapshots)
  }

  logCheckinEvent(checkinId: string, eventType: CheckinEventType, comment?: string): Promise<{ event: string }> {
    return this.esupervisionApiClient.logCheckinEvent(checkinId, eventType, comment)
  }

  verifyIdentity(
    checkinId: string,
    personalDetails: {
      crn: string
      name: { forename: string; surname: string }
      dateOfBirth: string
    },
  ): Promise<{ verified: boolean; error?: string }> {
    return this.esupervisionApiClient.verifyIdentity(checkinId, personalDetails)
  }

  getOffenderQuestions(checkinId: string): Promise<OffenderQuestionsResponse> {
    return this.esupervisionApiClient.getOffenderQuestions(checkinId)
  }

  createLivenessSession(checkinId: string): Promise<LivenessSession> {
    return this.esupervisionApiClient.createLivenessSession(checkinId)
  }

  getLivenessCredentials(checkinId: string): Promise<LivenessCredentials> {
    return this.esupervisionApiClient.getLivenessCredentials(checkinId)
  }

  verifyLiveness(checkinId: string, sessionId: string): Promise<LivenessVerificationResult> {
    return this.esupervisionApiClient.verifyLiveness(checkinId, sessionId)
  }

  submitFeedback(feedback: Feedback): Promise<void> {
    return this.esupervisionApiClient.submitFeedback(feedback)
  }
}
