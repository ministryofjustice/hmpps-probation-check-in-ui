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

/**
 * Specifies content types for possible upload locations for a checkin.
 */
export type CheckinUploadContentTypes = {
  video: string
  reference: string
  snapshots: string[]
}

export default class EsupervisionApiClient extends RestClient {
  constructor(authenticationClient: AuthenticationClient) {
    super('eSupervision API', config.apis.esupervisionApi, logger, authenticationClient)
  }

  getCheckin(checkinId: string, includeUploads?: boolean): Promise<OffenderCheckinResponse> {
    return this.get<OffenderCheckinResponse>(
      {
        path: `/offender_checkins/${checkinId}`,
        query: { 'include-uploads': includeUploads },
      },
      asSystem(),
    )
  }

  async getCheckinUploadLocation(
    checkinId: string,
    contentTypes: CheckinUploadContentTypes,
  ): Promise<CheckinUploadLocationResponse> {
    const { video, reference, snapshots } = contentTypes
    const locations = await this.post<CheckinUploadLocationResponse>(
      {
        path: `/offender_checkins/${checkinId}/upload_location`,
        query: { video, reference, snapshots: snapshots.join(',') },
        headers: { 'Content-Type': 'application/json' },
      },
      asSystem(),
    )

    return locations
  }

  async submitCheckin(checkinId: string, submission: CheckinSubmission): Promise<Checkin> {
    return this.post<Checkin>(
      {
        path: `/offender_checkins/${checkinId}/submit`,
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
        path: `/offender_checkins/${checkinId}/auto_id_verify`,
        headers: { 'Content-Type': 'application/json' },
        query: { numSnapshots },
      },
      asSystem(),
    )
  }

  async logCheckinEvent(checkinId: string, eventType: CheckinEventType, comment?: string): Promise<{ event: string }> {
    return this.post<{ event: string }>(
      {
        path: `/offender_checkins/${checkinId}/event`,
        headers: { 'Content-Type': 'application/json' },
        data: JSON.stringify({ eventType, comment }),
      },
      asSystem(),
    )
  }
}
