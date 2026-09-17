import ProbationAccountApiClient from '../data/probationAccountApiClient'

export default class ProbationAccountService {
  constructor(private readonly probationAccountApiClient: ProbationAccountApiClient) {}

  /**
   * Registers interest in online probation accounts for the given CRN.
   */
  async registerAccountInterest(crn: string, answer: string): Promise<void> {
    await this.probationAccountApiClient.registerAccountInterest(crn, answer)
  }
}
