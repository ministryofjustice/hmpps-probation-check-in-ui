import SubmissionPage, { PageElement } from '../submissionPage'

export default class VideoRecordPage extends SubmissionPage {
  constructor() {
    super('Confirm your identity')
  }

  livenessRoot = (): PageElement => cy.get('#face-liveness-root')
}
