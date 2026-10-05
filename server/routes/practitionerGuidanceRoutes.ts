import { type RequestHandler, Router } from 'express'
import asyncMiddleware from '../middleware/asyncMiddleware'
import {
  PRACTITIONER_GUIDANCE_BASE_PATH,
  practitionerGuidancePages,
  practitionerGuidancePath,
} from './practitionerGuidancePages'

const renderGuidancePage: RequestHandler = (req, res, next) => {
  const slug = typeof req.params.slug === 'string' ? req.params.slug : ''
  const index = practitionerGuidancePages.findIndex(page => page.slug === slug)
  if (index < 0) {
    next()
    return
  }

  const titleFor = (key: string) => req.t(`public.practitionerGuidance.pages.${key}.title`)
  const toLink = (page: (typeof practitionerGuidancePages)[number]) => ({
    text: titleFor(page.titleKey),
    href: practitionerGuidancePath(page),
  })

  const currentPage = practitionerGuidancePages[index]
  const previous = practitionerGuidancePages[index - 1]
  const following = practitionerGuidancePages[index + 1]

  res.render(`pages/practitioner-guidance/${currentPage.view}`, {
    pageTitle: titleFor(currentPage.titleKey),
    contents: practitionerGuidancePages.map(page => ({ ...toLink(page), current: page.slug === slug })),
    previousPage: previous ? toLink(previous) : null,
    nextPage: following ? toLink(following) : null,
  })
}

export default function practitionerGuidanceRoutes(): Router {
  const router = Router()

  router.get(PRACTITIONER_GUIDANCE_BASE_PATH, asyncMiddleware(renderGuidancePage))
  router.get(`${PRACTITIONER_GUIDANCE_BASE_PATH}/:slug`, asyncMiddleware(renderGuidancePage))

  return router
}
