const SUBMISSION_ID = document.body.dataset.submissionId

function redirectToRecord(): void {
  if (!SUBMISSION_ID) return
  window.location.href = `/${SUBMISSION_ID}/liveness/record`
}

function setButtonDisabled(disabled: boolean): void {
  const button = document.getElementById('camera-error-start') as HTMLAnchorElement | null
  if (!button) return
  if (disabled) {
    button.classList.add('govuk-button--disabled')
    button.setAttribute('aria-disabled', 'true')
    const href = button.getAttribute('href')
    if (href) {
      button.dataset.href = href
      button.removeAttribute('href')
    }
  } else {
    button.classList.remove('govuk-button--disabled')
    button.removeAttribute('aria-disabled')
    if (button.dataset.href) {
      button.setAttribute('href', button.dataset.href)
      delete button.dataset.href
    }
  }
}

async function checkCameraPermission(): Promise<void> {
  if (!navigator.permissions?.query) return
  try {
    const status = await navigator.permissions.query({ name: 'camera' as PermissionName })
    if (status.state === 'granted') {
      redirectToRecord()
      return
    }
    setButtonDisabled(true)
    status.addEventListener('change', () => {
      if (status.state === 'granted') {
        redirectToRecord()
      } else {
        setButtonDisabled(true)
      }
    })
  } catch {
    // Permissions API doesn't recognise 'camera' on this browser (e.g. older Safari).
    // Without it we can't detect a silent permission change, so leave the user on the page.
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', checkCameraPermission)
} else {
  checkCameraPermission()
}
