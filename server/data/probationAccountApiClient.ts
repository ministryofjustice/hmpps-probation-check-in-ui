import { RestClient, asSystem } from '@ministryofjustice/hmpps-rest-client'
import type { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import config from '../config'
import logger from '../../logger'

/**
 * Client for the Probation Account API
 */
export default class ProbationAccountApiClient extends RestClient {
  constructor(authenticationClient: AuthenticationClient) {
    super('Probation Account API', config.apis.probationAccountApi, logger, authenticationClient)
  }

  /**
   * Registers that the person identified by `crn` wants to hear more about online
   * probation accounts.
   */
  async registerAccountInterest(crn: string): Promise<void> {
    return this.post<void>(
      {
        path: '/v1/access-requests',
        headers: { 'Content-Type': 'application/json' },
        data: JSON.stringify({ crn }),
      },
      asSystem(),
    )
  }
}
