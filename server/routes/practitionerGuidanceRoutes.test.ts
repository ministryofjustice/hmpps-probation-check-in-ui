import type { Express } from 'express'
import request from 'supertest'
import { appWithAllRoutes } from './testutils/appSetup'
import { practitionerGuidancePages, practitionerGuidancePath } from './practitionerGuidancePages'

let app: Express

beforeEach(() => {
  app = appWithAllRoutes({})
})

describe('practitioner guidance routes', () => {
  it('renders the index page as the first page in the section', async () => {
    const res = await request(app).get('/practitioner-guidance')

    expect(res.status).toBe(200)
    expect(res.text).toContain('<h1 class="govuk-heading-xl">Online check ins</h1>')
    expect(res.text).toContain('<h2 class="govuk-heading-l">About online check ins and what you need to do</h2>')
    // index has no previous page but does have a next page
    expect(res.text).not.toContain('govuk-pagination__prev')
    expect(res.text).toContain('govuk-pagination__next')
    expect(res.text).toContain('href="/practitioner-guidance/how-you-can-use-online-check-ins"')
  })

  it.each(practitionerGuidancePages.map(page => [practitionerGuidancePath(page), page] as const))(
    'renders %s with the contents list and pagination',
    async (path, page) => {
      const res = await request(app).get(path)

      expect(res.status).toBe(200)
      expect(res.text).toContain('es-contents-list')

      // Current page is shown as plain text, every other page as a link
      expect(res.text).toContain('<span class="es-contents-list__current" aria-current="page">')
      practitionerGuidancePages
        .filter(other => other !== page)
        .forEach(other => {
          expect(res.text).toContain(`href="${practitionerGuidancePath(other)}"`)
        })
      const currentLinkCount =
        res.text.split(`<a class="govuk-link govuk-link--no-visited-state" href="${path}"`).length - 1
      expect(currentLinkCount).toBe(0)
    },
  )

  it('renders previous and next links pointing at adjacent pages', async () => {
    const res = await request(app).get('/practitioner-guidance/before-you-sign-someone-up')

    expect(res.status).toBe(200)
    expect(res.text).toContain('govuk-pagination__prev')
    expect(res.text).toContain('govuk-pagination__next')
    expect(res.text).toContain('How you can use online check ins')
    expect(res.text).toContain('What the person on probation views')
  })

  it('renders only a previous link on the last page', async () => {
    const res = await request(app).get('/practitioner-guidance/giving-feedback-and-case-studies')

    expect(res.status).toBe(200)
    expect(res.text).toContain('govuk-pagination__prev')
    expect(res.text).not.toContain('govuk-pagination__next')
  })

  it('returns 404 for an unknown guidance page', async () => {
    const res = await request(app).get('/practitioner-guidance/not-a-real-page')

    expect(res.status).toBe(404)
  })
})
