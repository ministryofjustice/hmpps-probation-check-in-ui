export interface ExpiredContent {
  title: string
  message: string
}

export const EXPIRED_CONTENT: ExpiredContent = {
  title: 'Your check in link has expired',
  message: 'Contact your probation officer to request a new link.',
}
