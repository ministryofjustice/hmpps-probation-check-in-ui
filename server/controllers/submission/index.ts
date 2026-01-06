// Re-export all submission controllers for easy importing

export { renderIndex, handleStart } from './indexController'
export { renderVerify, handleVerify } from './verifyController'
export {
  renderMentalHealth,
  handleMentalHealth,
  renderAssistance,
  handleAssistance,
  renderCallback,
  handleCallback,
} from './questionsController'
export { renderVideoInform, renderVideoRecord, handleVideoVerify, renderViewVideo } from './videoController'
export { renderCheckAnswers, handleSubmission } from './checkAnswersController'
export { renderConfirmation } from './confirmationController'
export { renderTimeout, handleKeepalive } from './sessionController'

// Export helpers for use in other modules
export { buildPageParams, buildBackLink, buildRedirectUrl, getSubmissionId } from './helpers'
