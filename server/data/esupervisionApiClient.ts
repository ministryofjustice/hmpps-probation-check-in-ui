import { RestClient, asSystem } from '@ministryofjustice/hmpps-rest-client'
import type { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import config from '../config'
import logger from '../../logger'
import Checkin from './models/checkin'
import CheckinUploadLocationResponse from './models/checkinUploadLocationResponse'
import CheckinSubmission from './models/checkinSubmission'
import OffenderCheckinResponse from './models/offenderCheckinResponse'
import AutomaticCheckinVerificationResult from './models/automaticCheckinVerificationResult'
import { CheckinEventType } from './models/checkinEvent'
import Feedback from './models/feedback'
import { OffenderQuestionsResponse } from './models/offenderQuestionsResponse'
import LivenessSession from './models/livenessSession'
import LivenessCredentials from './models/livenessCredentials'
import LivenessVerificationResult from './models/livenessVerificationResult'

/**
 * Specifies content types for possible upload locations for a checkin.
 */
export type CheckinUploadContentTypes = {
  video: string
  snapshots: string[]
}

/**
 * Per-snapshot SHA-256 (base64) digests, used to bind each presigned snapshot URL to the
 * exact bytes the client is about to upload. Optional during dual-mode rollout
 * (sign:true, require:false) — clients that don't hash get an unbound URL.
 */
export type CheckinUploadHashes = {
  snapshots?: { sha256: string }[]
}

export default class EsupervisionApiClient extends RestClient {
  constructor(authenticationClient: AuthenticationClient) {
    super('eSupervision API', config.apis.esupervisionApi, logger, authenticationClient)
  }

  async getCheckin(checkinId: string): Promise<OffenderCheckinResponse> {
    const checkin = await this.get<Checkin>(
      {
        path: `/v2/offender_checkins/${checkinId}`,
      },
      asSystem(),
    )
    // Wrap response to maintain compatibility with existing UI code
    return { checkin, checkinLogs: { hint: 'OMITTED', logs: [] } }
  }

  async getCheckinUploadLocation(
    checkinId: string,
    contentTypes: CheckinUploadContentTypes,
    hashes?: CheckinUploadHashes,
  ): Promise<CheckinUploadLocationResponse> {
    const { video, snapshots } = contentTypes
    const query: Record<string, string> = {
      video,
      snapshots: snapshots.join(','),
    }

    return this.post<CheckinUploadLocationResponse>(
      {
        path: `/v2/offender_checkins/${checkinId}/upload_location`,
        query,
        headers: { 'Content-Type': 'application/json' },
        data: hashes ? JSON.stringify(hashes) : undefined,
      },
      asSystem(),
    )
  }

  async submitCheckin(checkinId: string, submission: CheckinSubmission): Promise<Checkin> {
    return this.post<Checkin>(
      {
        path: `/v2/offender_checkins/${checkinId}/submit`,
        headers: { 'Content-Type': 'application/json' },
        data: JSON.stringify(submission),
      },
      asSystem(),
    )
  }

  async autoVerifyCheckinIdentity(
    checkinId: string,
    numSnapshots: number,
  ): Promise<AutomaticCheckinVerificationResult> {
    return this.post<AutomaticCheckinVerificationResult>(
      {
        path: `/v2/offender_checkins/${checkinId}/video-verify`,
        headers: { 'Content-Type': 'application/json' },
        query: { numSnapshots },
      },
      asSystem(),
    )
  }

  async logCheckinEvent(checkinId: string, eventType: CheckinEventType, comment?: string): Promise<{ event: string }> {
    return this.post<{ event: string }>(
      {
        path: `/v2/offender_checkins/${checkinId}/log-event`,
        headers: { 'Content-Type': 'application/json' },
        data: JSON.stringify({ eventType, comment }),
      },
      asSystem(),
    )
  }

  async verifyIdentity(
    checkinId: string,
    personalDetails: {
      crn: string
      name: { forename: string; surname: string }
      dateOfBirth: string
    },
  ): Promise<{ verified: boolean; error?: string }> {
    return this.post<{ verified: boolean; error?: string }>(
      {
        path: `/v2/offender_checkins/${checkinId}/identity-verify`,
        headers: { 'Content-Type': 'application/json' },
        data: JSON.stringify(personalDetails),
      },
      asSystem(),
    )
  }

  async getOffenderQuestions(checkinId: string): Promise<OffenderQuestionsResponse> {
    return this.get<OffenderQuestionsResponse>(
      { path: `/v2/questions/checkin/${checkinId}/offender-questions?language=en-GB` },
      asSystem(),
    )
  }

  async createLivenessSession(checkinId: string): Promise<LivenessSession> {
    return this.post<LivenessSession>(
      {
        path: `/v2/offender_checkins/${checkinId}/liveness/session`,
        headers: { 'Content-Type': 'application/json' },
      },
      asSystem(),
    )
  }

  async getLivenessCredentials(checkinId: string): Promise<LivenessCredentials> {
    return this.get<LivenessCredentials>(
      {
        path: `/v2/offender_checkins/${checkinId}/liveness/credentials`,
      },
      asSystem(),
    )
  }

  async verifyLiveness(checkinId: string, sessionId: string): Promise<LivenessVerificationResult> {
    return this.post<LivenessVerificationResult>(
      {
        path: `/v2/offender_checkins/${checkinId}/liveness/verify`,
        headers: { 'Content-Type': 'application/json' },
        data: JSON.stringify({ sessionId }),
      },
      asSystem(),
    )
  }

  async reportLivenessClientFailure(checkinId: string, state: string | undefined): Promise<void> {
    return this.post<void>(
      {
        path: `/v2/offender_checkins/${checkinId}/liveness/client-failure`,
        headers: { 'Content-Type': 'application/json' },
        data: JSON.stringify({ state: state ?? null }),
      },
      asSystem(),
    )
  }

  async submitFeedback(feedback: Feedback): Promise<void> {
    return this.post<void>(
      {
        path: '/v2/feedback',
        headers: { 'Content-Type': 'application/json' },
        data: JSON.stringify(feedback),
      },
      asSystem(),
    )
  }
}
