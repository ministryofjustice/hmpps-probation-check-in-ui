import CheckinPage, { PageElement } from '../checkinPage'

export default class VideoRecordPage extends CheckinPage {
  constructor() {
    super('Record your video')
  }

  videoElement = (): PageElement => cy.get('#video')

  startRecordingButton = (): PageElement => cy.get('#startBtn')

  statusTag = (): PageElement => cy.get('#statusTag')
}
