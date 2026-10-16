import { type RequestHandler, Router } from 'express'
import asyncMiddleware from '../middleware/asyncMiddleware'
import { POP_GUIDANCE_BASE_PATH, popGuidancePages, popGuidancePath } from './popGuidancePages'

const renderGuidancePage: RequestHandler = (req, res) => {
  const slug = typeof req.params.slug === 'string' ? req.params.slug : ''
  const index = popGuidancePages.findIndex(page => page.slug === slug)
  if (index < 0) {
    res.status(404).render('pages/not-found')
    return
  }

  // When reached from a check in, keep the submission id in links so the back link survives navigation
  const submissionId = typeof req.query.submissionId === 'string' ? req.query.submissionId : undefined
  const query = submissionId ? `?submissionId=${encodeURIComponent(submissionId)}` : ''

  const titleFor = (key: string) => req.t(`public.popGuidance.pages.${key}.title`)
  const toLink = (page: (typeof popGuidancePages)[number]) => ({
    text: titleFor(page.titleKey),
    href: `${popGuidancePath(page)}${query}`,
  })

  const currentPage = popGuidancePages[index]
  const previous = popGuidancePages[index - 1]
  const following = popGuidancePages[index + 1]

  res.render(`pages/pop-guidance/${currentPage.view}`, {
    pageTitle: titleFor(currentPage.titleKey),
    backLink: submissionId ? `/${encodeURIComponent(submissionId)}` : undefined,
    contents: popGuidancePages.map(page => ({ ...toLink(page), current: page.slug === slug })),
    previousPage: previous ? toLink(previous) : null,
    nextPage: following ? toLink(following) : null,
  })
}

export default function popGuidanceRoutes(): Router {
  const router = Router()

  router.get(POP_GUIDANCE_BASE_PATH, asyncMiddleware(renderGuidancePage))
  router.get(`${POP_GUIDANCE_BASE_PATH}/:slug`, asyncMiddleware(renderGuidancePage))

  return router
}
