function SessionTimeOutModal(submissionId) {
  this.modal = null
  this.modalId = 'es-session-timeout-modal'
  this.inactivityCountdownTime = document.body.dataset.timeout || 30 // minutes
  this.modalCountdownTime = document.body.dataset.modalcount || 300 // seconds
  this.modalTimeout = null
  this.urls = {
    renew: `/${submissionId}/keepalive`,
    logout: `/${submissionId}/timeout`,
  }
  this.modalHtml = `
        <dialog class="es-modal" role="dialog" aria-modal="true" id="${this.modalId}">
            <div class="es-modal__body" tabindex="0">
                <h1 class="govuk-heading-l">Your check in will time out soon<span class="govuk-visually-hidden">.</span></h1>
                <p class="govuk-body">Your check in will reset in <strong>${this.formatTime(this.modalCountdownTime)}</strong>.</p>
                <p class="govuk-body">For your security, any information you have entered will not be saved.</p>
                <div class="es-modal__actions govuk-button-group">
                    <button class="govuk-button" id="es-timeout-action-renew" aria-label="Continue check in">Continue check in</button>
                    <span class="govuk-visually-hidden">or</span>
                    <a class="govuk-link govuk-link--no-visited-state" id="es-timeout-action-logout" href="${this.urls.logout}" aria-label="Exit check in">Exit check in</a>
                </div>
            </div>
        </dialog>`
}

SessionTimeOutModal.prototype.init = function init() {
  this.startInactivityCountdown()
}

SessionTimeOutModal.prototype.startInactivityCountdown = function startInactivityCountdown() {
  setTimeout(this.showModal.bind(this), this.inactivityCountdownTime * 60 * 1000)
}

SessionTimeOutModal.prototype.formatTime = function formatTime(seconds) {
  if (seconds < 60) {
    return `${seconds} seconds`
  }
  const minutes = Math.floor(seconds / 60)
  const minutesLabel = minutes === 1 ? 'minute' : 'minutes'
  const secs = seconds % 60
  const secsLabel = secs === 1 ? 'second' : 'seconds'
  return `${String(minutes)} ${minutesLabel} ${String(secs)} ${secsLabel}`
}

SessionTimeOutModal.prototype.showModal = function showModal() {
  document.body.insertAdjacentHTML('beforeend', this.modalHtml)
  this.modal = document.getElementById(this.modalId)
  this.modal.showModal()
  this.modalEvents()
  this.startModalCountdown()
}

SessionTimeOutModal.prototype.modalEvents = function modalEvents() {
  const renewButton = document.getElementById('es-timeout-action-renew')
  renewButton.addEventListener('click', this.renewSession.bind(this))
  this.modal.addEventListener('cancel', e => {
    e.preventDefault()
  })
}

SessionTimeOutModal.prototype.startModalCountdown = function startModalCountdown() {
  let countdownTime = this.modalCountdownTime
  const countdownDisplay = this.modal.getElementsByTagName('strong')[0]
  this.modalTimeout = setInterval(() => {
    countdownTime -= 1
    countdownDisplay.textContent = `${this.formatTime(countdownTime)}`
    if (countdownTime <= 0) {
      clearInterval(this.modalTimeout)
      window.location.href = this.urls.logout
    }
  }, 1000)
}

SessionTimeOutModal.prototype.renewSession = function renewSession(e) {
  e.preventDefault()

  const button = e.target
  button.disabled = true

  fetch(this.urls.renew, {
    method: 'GET',
    credentials: 'include',
  })
    .then(response => {
      if (response.ok) {
        this.hideModal()
        this.startInactivityCountdown()
      } else {
        console.error('Failed to renew session') // eslint-disable-line no-console
      }
    })
    .catch(
      error => console.error('Error:', error), // eslint-disable-line no-console
    )
}

SessionTimeOutModal.prototype.hideModal = function hideModal() {
  clearInterval(this.modalTimeout)
  this.modal.close()
  this.modal.remove()
}

document.addEventListener('DOMContentLoaded', function pageLoad() {
  const { submissionId } = document.body.dataset
  const sessionTimeOutModal = new SessionTimeOutModal(submissionId)
  sessionTimeOutModal.init()
})
