export interface TimeoutContent {
  title: string
  message: string
  buttonText: string
}

export const TIMEOUT_CONTENT: TimeoutContent = {
  title: 'Your check in has been reset',
  message: 'For your security, your answers have been deleted.',
  buttonText: 'Restart check in',
}
