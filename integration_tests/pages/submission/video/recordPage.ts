import SubmissionPage, { PageElement } from '../submissionPage'

export default class VideoRecordPage extends SubmissionPage {
  constructor() {
    super('Verify your identity')
  }

  livenessRoot = (): PageElement => cy.get('#face-liveness-root')

  simulateCompleteButton = (): PageElement => cy.get('[data-qa="mock-complete"]')

  simulateErrorButton = (): PageElement => cy.get('[data-qa="mock-error"]')

  simulateCancelButton = (): PageElement => cy.get('[data-qa="mock-cancel"]')

  simulateTimeoutButton = (): PageElement => cy.get('[data-qa="mock-timeout"]')

  simulateConnectionTimeoutButton = (): PageElement => cy.get('[data-qa="mock-connection-timeout"]')

  simulateDefaultCameraNotFoundButton = (): PageElement => cy.get('[data-qa="mock-default-camera-not-found"]')

  simulateCameraAccessButton = (): PageElement => cy.get('[data-qa="mock-camera-access"]')

  simulateMultipleFacesButton = (): PageElement => cy.get('[data-qa="mock-multiple-faces"]')

  simulateMobileLandscapeButton = (): PageElement => cy.get('[data-qa="mock-mobile-landscape"]')

  simulateCameraFramerateButton = (): PageElement => cy.get('[data-qa="mock-camera-framerate"]')

  verifyHeadingText(expectedText: string) {
    cy.contains('h1', expectedText).should('be.visible')
  }

  verifySubHeadingText(expectedText: string) {
    cy.contains('h2', expectedText).should('be.visible')
  }
}
