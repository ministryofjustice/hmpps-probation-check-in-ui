import { RequestHandler } from 'express'

const requireAuth: RequestHandler = (req, res, next) => {
  const { submissionAuthorized } = req.session

  if (!submissionAuthorized) {
    const { submissionId } = req.params
    return res.render('pages/timeout', { submissionId })
  }

  res.locals.submissionAuthorized = submissionAuthorized
  return next()
}

export default requireAuth
