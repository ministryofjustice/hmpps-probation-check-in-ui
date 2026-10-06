import type { Express } from 'express'
import request from 'supertest'
import { appWithAllRoutes } from './testutils/appSetup'
import { popGuidancePages, popGuidancePath } from './popGuidancePages'

let app: Express

beforeEach(() => {
  app = appWithAllRoutes({})
})

describe('people on probation guidance routes', () => {
  it('renders the index page as the first page in the section', async () => {
    const res = await request(app).get('/guidance')

    expect(res.status).toBe(200)
    expect(res.text).toContain('<h1 class="govuk-heading-xl">Check in with your probation officer guidance</h1>')
    expect(res.text).toContain(
      '<h2 class="govuk-heading-l">About the Check in with your probation officer service</h2>',
    )
    // index has no previous page but does have a next page
    expect(res.text).not.toContain('govuk-pagination__prev')
    expect(res.text).toContain('govuk-pagination__next')
    expect(res.text).toContain('href="/guidance/before-your-probation-officer-signs-you-up"')
  })

  it.each(popGuidancePages.map(page => [popGuidancePath(page), page] as const))(
    'renders %s with the contents list and pagination',
    async (path, page) => {
      const res = await request(app).get(path)

      expect(res.status).toBe(200)
      expect(res.text).toContain('es-contents-list')

      // Current page is shown as plain text, every other page as a link
      expect(res.text).toContain('<span class="es-contents-list__current" aria-current="page">')
      popGuidancePages
        .filter(other => other !== page)
        .forEach(other => {
          expect(res.text).toContain(`href="${popGuidancePath(other)}"`)
        })
      const currentLinkCount =
        res.text.split(`<a class="govuk-link govuk-link--no-visited-state" href="${path}"`).length - 1
      expect(currentLinkCount).toBe(0)
    },
  )

  it('renders previous and next links pointing at adjacent pages', async () => {
    const res = await request(app).get('/guidance/how-we-use-your-information')

    expect(res.status).toBe(200)
    expect(res.text).toContain('govuk-pagination__prev')
    expect(res.text).toContain('govuk-pagination__next')
    expect(res.text).toContain('Before your probation officer signs you up')
    expect(res.text).toContain('Signing up to use online check ins')
  })

  it('renders only a previous link on the last page', async () => {
    const res = await request(app).get('/guidance/giving-feedback-about-online-check-ins')

    expect(res.status).toBe(200)
    expect(res.text).toContain('govuk-pagination__prev')
    expect(res.text).not.toContain('govuk-pagination__next')
  })

  it('does not show a back link when not reached from a check in', async () => {
    const res = await request(app).get('/guidance')

    expect(res.text).not.toContain('govuk-back-link')
  })

  it('shows a back link to the check in and keeps the submission id in navigation links', async () => {
    const res = await request(app).get('/guidance?submissionId=abc-123')

    expect(res.status).toBe(200)
    expect(res.text).toContain('href="/abc-123" class="govuk-back-link"')
    expect(res.text).toContain('href="/guidance/before-your-probation-officer-signs-you-up?submissionId=abc-123"')
  })

  it('returns 404 for an unknown guidance page', async () => {
    const res = await request(app).get('/guidance/not-a-real-page')

    expect(res.status).toBe(404)
  })
})
