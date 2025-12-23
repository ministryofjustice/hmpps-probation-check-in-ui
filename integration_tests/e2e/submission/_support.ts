/**
 * Shared test support for check-in journey tests
 */
import AutomatedIdVerificationResult from '../../../server/data/models/automatedIdVerificationResult'
import Checkin from '../../../server/data/models/checkin'
import CheckinStatus from '../../../server/data/models/checkinStatus'
import Offender from '../../../server/data/models/offender'
import OffenderStatus from '../../../server/data/models/offenderStatus'
import { createMockCheckin, createMockOffender } from '../../mockApis/esupervisionApi'
import AssistancePage from '../../pages/submission/assistancePage'
import CallbackPage from '../../pages/submission/callbackPage'
import CheckinIndexPage from '../../pages/submission/checkinIndexPage'
import MentalHealthPage from '../../pages/submission/mentalHealthPage'
import PersonalDetailsPage from '../../pages/submission/personalDetailsPage'
import SubmissionPage from '../../pages/submission/submissionPage'

export interface TestContext {
  testOffender: Offender
  testCheckin: Checkin
}

/**
 * Create test fixtures for offender and checkin
 */
export function createTestFixtures(): TestContext {
  const testOffender = createMockOffender({ status: OffenderStatus.Verified })
  const testCheckin = createMockCheckin(testOffender, {
    status: CheckinStatus.Created,
    autoIdCheck: AutomatedIdVerificationResult.Match,
  })
  return { testOffender, testCheckin }
}

/**
 * Setup common stubs for all check-in tests
 */
export function setupCommonStubs(testCheckin: Checkin): Cypress.Chainable {
  return cy.task('reset').then(() => {
    cy.task('stubAuthToken')
    cy.task('stubGetCheckin', testCheckin)
    cy.task('stubGetCheckinUploadLocation', testCheckin)
    cy.task('stubFakeS3Upload')
    cy.task('stubVerifyIdentity', testCheckin)
    cy.task('stubAutoVerifyCheckinIdentity', testCheckin)
    cy.task('stubSubmitCheckin', testCheckin)
  })
}

/**
 * Complete identity verification and establish a session
 */
export function completeVerification(testCheckin: Checkin, testOffender: Offender): void {
  cy.visit(`/${testCheckin.uuid}`)
  const indexPage = SubmissionPage.verifyOnPage(CheckinIndexPage)
  indexPage.startButton().click()

  const personalDetailsPage = SubmissionPage.verifyOnPage(PersonalDetailsPage)
  const dob = new Date(testOffender.dateOfBirth)
  personalDetailsPage.completeForm({
    firstName: testOffender.firstName,
    lastName: testOffender.lastName,
    day: dob.getDate().toString(),
    month: (dob.getMonth() + 1).toString(),
    year: dob.getFullYear().toString(),
  })
  personalDetailsPage.continueButton().click()
}

/**
 * Navigate through all questions (mental health, assistance, callback)
 */
export function completeQuestions(): void {
  // Mental health
  const mentalHealthPage = SubmissionPage.verifyOnPage(MentalHealthPage)
  mentalHealthPage.okRadio().click()
  mentalHealthPage.continueButton().click()

  // Assistance
  const assistancePage = SubmissionPage.verifyOnPage(AssistancePage)
  assistancePage.selectNoHelp()
  assistancePage.continueButton().click()

  // Callback
  const callbackPage = SubmissionPage.verifyOnPage(CallbackPage)
  callbackPage.selectNo()
  callbackPage.continueButton().click()
}

// Re-export commonly used items
export {
  AutomatedIdVerificationResult,
  Checkin,
  CheckinStatus,
  Offender,
  OffenderStatus,
  createMockCheckin,
  createMockOffender,
}
