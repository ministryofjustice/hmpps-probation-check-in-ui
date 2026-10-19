import { readFileSync } from 'fs'
import path from 'path'
import type { Express } from 'express'
import request from 'supertest'
import { appWithAllRoutes } from './testutils/appSetup'

type Translations = {
  common: { skipToChatbot: string }
  public: { chatbotPrivacy: Record<string, unknown> & { heading: string } }
}

function loadTranslations(lang: string): Translations {
  const file = path.join(__dirname, `../locales/${lang}/translation.json`)
  return JSON.parse(readFileSync(file, 'utf8')) as Translations
}

function leafKeys(value: unknown, prefix = ''): string[] {
  if (value && typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) =>
      leafKeys(child, prefix ? `${prefix}.${key}` : key),
    )
  }
  return [prefix]
}

const en = loadTranslations('en')
const cy = loadTranslations('cy')

let app: Express

beforeEach(() => {
  app = appWithAllRoutes({})
})

describe('GET /privacy-notice/chatbot', () => {
  it('renders the chatbot privacy notice in English by default', async () => {
    const res = await request(app).get('/privacy-notice/chatbot').expect(200)
    expect(res.text).toContain(en.public.chatbotPrivacy.heading)
  })

  it('renders the chatbot privacy notice in Welsh when the language cookie is cy', async () => {
    const res = await request(app).get('/privacy-notice/chatbot').set('Cookie', 'lang=cy').expect(200)
    expect(res.text).toContain(cy.public.chatbotPrivacy.heading)
    expect(res.text).not.toContain(en.public.chatbotPrivacy.heading)
  })
})

describe('chatbot privacy notice translations', () => {
  it('has the same keys in Welsh as in English, so no paragraph silently falls back to English', () => {
    expect(leafKeys(cy.public.chatbotPrivacy).sort()).toEqual(leafKeys(en.public.chatbotPrivacy).sort())
  })
})

describe('chatbot pop-up wiring in the page layout', () => {
  it('adds the skip link, the mount point before the footer and the script when the chatbot is enabled', async () => {
    app.locals.chatbotEnabled = true
    const res = await request(app).get('/privacy-notice/chatbot').expect(200)
    expect(res.text).toContain('href="#chatbot-launcher"')
    expect(res.text).toContain(en.common.skipToChatbot)
    expect(res.text).toContain('id="chatbot-root"')
    expect(res.text).toMatch(/<script type="module" src="[^"]*chatbot[^"]*\.js"/)
    expect(res.text).toMatch(/<link href="[^"]*chatbot[^"]*\.css"/)
    const footerAt = res.text.indexOf('govuk-footer')
    expect(footerAt).toBeGreaterThan(-1)
    expect(res.text.indexOf('id="chatbot-root"')).toBeLessThan(footerAt)
  })

  it('renders none of it when the chatbot is disabled', async () => {
    app.locals.chatbotEnabled = false
    const res = await request(app).get('/privacy-notice/chatbot').expect(200)
    expect(res.text).not.toContain('#chatbot-launcher')
    expect(res.text).not.toContain('id="chatbot-root"')
    expect(res.text).not.toMatch(/chatbot[^"]*\.js/)
  })
})
