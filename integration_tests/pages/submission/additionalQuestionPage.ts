import { PageElement } from '../page'
import SubmissionPage from './submissionPage'

export default class AdditionalQuestionPage extends SubmissionPage {
  constructor(questionText: string) {
    super(questionText)
  }

  answerTextarea = (): PageElement => cy.get('#additionalAnswer')

  continueButton = (): PageElement => cy.contains('button', 'Continue')

  errorSummary = (): PageElement => cy.get('.govuk-error-summary')

  errorMessage = (): PageElement => cy.get('#additionalAnswer-error')
}
