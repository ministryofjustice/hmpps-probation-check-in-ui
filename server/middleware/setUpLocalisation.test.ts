import express from 'express'
import cookieParser from 'cookie-parser'
import request from 'supertest'
import setUpLocalisation from './setUpLocalisation'

function buildApp() {
  const app = express()
  app.use(cookieParser())
  app.use(setUpLocalisation())
  app.get('/probe', (req, res) => {
    res.json({
      lang: res.locals.lang,
      htmlLang: res.locals.htmlLang,
      languageUrls: res.locals.languageUrls,
      sample: req.t('common.languageToggle.label'),
    })
  })
  return app
}

describe('setUpLocalisation', () => {
  const app = buildApp()

  it('defaults to English when no cookie is present', async () => {
    const res = await request(app).get('/probe')
    expect(res.status).toBe(200)
    expect(res.body.lang).toBe('en')
    expect(res.body.htmlLang).toBe('en')
    expect(res.body.sample).toBe('Change the language')
  })

  it('exposes language toggle URLs that point at the same path with lang= set', async () => {
    const res = await request(app).get('/probe?foo=bar')
    expect(res.body.languageUrls).toEqual({
      en: '/probe?foo=bar&lang=en',
      cy: '/probe?foo=bar&lang=cy',
    })
  })

  it('sets the language cookie and redirects when ?lang=cy is supplied', async () => {
    const res = await request(app).get('/probe?lang=cy')
    expect(res.status).toBe(302)
    expect(res.headers.location).toBe('/probe')
    expect(res.headers['set-cookie']).toEqual(expect.arrayContaining([expect.stringMatching(/^lang=cy;/)]))
  })

  it('preserves remaining query params when stripping the lang param', async () => {
    const res = await request(app).get('/probe?foo=bar&lang=cy&baz=qux')
    expect(res.status).toBe(302)
    expect(res.headers.location).toBe('/probe?foo=bar&baz=qux')
  })

  it('redirects but does not set a cookie for an unsupported lang value', async () => {
    const res = await request(app).get('/probe?lang=xx')
    expect(res.status).toBe(302)
    expect(res.headers.location).toBe('/probe')
    expect(res.headers['set-cookie']).toBeUndefined()
  })

  it('reads the language back from the cookie on subsequent requests', async () => {
    const res = await request(app).get('/probe').set('Cookie', ['lang=cy'])
    expect(res.body.lang).toBe('cy')
    expect(res.body.htmlLang).toBe('cy')
  })
})
