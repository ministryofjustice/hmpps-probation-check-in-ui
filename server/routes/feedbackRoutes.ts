import { type RequestHandler, Router } from 'express'
import asyncMiddleware from '../middleware/asyncMiddleware'
import handleFeedbackSubmission from '../controllers/feedbackController'
import { improvementOptions } from '../data/models/feedback'

const buildImprovementOptions = () => {
  const last = improvementOptions[improvementOptions.length - 1]

  const withDivider = [
    ...improvementOptions.slice(0, improvementOptions.length - 1).map(o => ({
      value: o.value,
      text: o.text,
    })),
    { divider: 'or' },

    { value: last.value, text: last.text },
  ]

  return withDivider
}

export default function feedbackRoutes(): Router {
  const router = Router({ mergeParams: true })

  const get = (routePath: string | string[], ...handlers: RequestHandler[]) =>
    router.get(routePath, ...handlers.map(handler => asyncMiddleware(handler)))

  get('/feedback', (req, res, next) => {
    res.render('pages/feedback/provide-feedback', {
      improvementItems: buildImprovementOptions(),
    })
  })

  router.post('/feedback', handleFeedbackSubmission)

  return router
}
