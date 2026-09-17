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
   * Registers that a person identified by `crn` and whether they would find
   * probation accounts useful.
   */
  async registerAccountInterest(crn: string, answer: string): Promise<void> {
    return this.post<void>(
      {
        path: '/v1/access-requests',
        headers: { 'Content-Type': 'application/json' },
        data: JSON.stringify({ personReference: crn, interested: answer }),
      },
      asSystem(),
    )
  }
}
