import { readFileSync } from 'fs'
import path from 'path'
import type { Express } from 'express'
import request from 'supertest'
import { appWithAllRoutes } from './testutils/appSetup'

type Translations = { public: { chatbotPrivacy: Record<string, unknown> & { heading: string } } }

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
