import flash from 'connect-flash'
import { Router } from 'express'

export default function setupAuthentication() {
  const router = Router()

  // Flash messages are used for form validation errors in the submission flow
  router.use(flash())

  return router
}
