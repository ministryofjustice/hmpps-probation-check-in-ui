import { Request, Response, NextFunction } from 'express'
import languageMiddleware, { localizedUrl } from './languageMiddleware'

jest.mock('../content', () => ({
  DEFAULT_LANGUAGE: 'en',
  isValidLanguage: (lang: string) => ['en', 'cy'].includes(lang),
  t: jest.fn((lang: string, key: string) => `${lang}:${key}`),
  getContent: jest.fn((lang: string, key: string) => ({ lang, key })),
  getNamespace: jest.fn((lang: string, namespace: string) => ({ lang, namespace })),
}))

describe('languageMiddleware', () => {
  let mockRes: Partial<Response>
  let mockNext: jest.MockedFunction<NextFunction>

  const createMockReq = (overrides: Partial<Request> = {}): Partial<Request> => ({
    path: '/',
    originalUrl: '/',
    cookies: {},
    session: {} as Request['session'],
    ...overrides,
  })

  beforeEach(() => {
    mockRes = {
      cookie: jest.fn(),
      redirect: jest.fn(),
      locals: {} as Response['locals'],
    }
    mockNext = jest.fn()
  })

  describe('URL with language prefix', () => {
    it('sets cookie and redirects when /en/ prefix is present', () => {
      const mockReq = createMockReq({ path: '/en/some-page', originalUrl: '/en/some-page' })

      const middleware = languageMiddleware()
      middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.cookie).toHaveBeenCalledWith('lang', 'en', {
        maxAge: expect.any(Number),
        httpOnly: true,
        sameSite: 'lax',
      })
      expect(mockRes.redirect).toHaveBeenCalledWith(302, '/some-page')
      expect(mockNext).not.toHaveBeenCalled()
    })

    it('sets cookie and redirects when /cy/ prefix is present', () => {
      const mockReq = createMockReq({ path: '/cy/some-page', originalUrl: '/cy/some-page' })

      const middleware = languageMiddleware()
      middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.cookie).toHaveBeenCalledWith('lang', 'cy', {
        maxAge: expect.any(Number),
        httpOnly: true,
        sameSite: 'lax',
      })
      expect(mockRes.redirect).toHaveBeenCalledWith(302, '/some-page')
    })

    it('stores language in session when redirecting', () => {
      const mockReq = createMockReq({ path: '/cy/page', originalUrl: '/cy/page' })

      const middleware = languageMiddleware()
      middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockReq.session!.lang).toBe('cy')
    })

    it('redirects to root when only language prefix is present', () => {
      const mockReq = createMockReq({ path: '/en', originalUrl: '/en' })

      const middleware = languageMiddleware()
      middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.redirect).toHaveBeenCalledWith(302, '/')
    })

    it('handles language prefix at end of path', () => {
      const mockReq = createMockReq({ path: '/en/', originalUrl: '/en/' })

      const middleware = languageMiddleware()
      middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.redirect).toHaveBeenCalledWith(302, '/')
    })
  })

  describe('URL without language prefix', () => {
    it('uses English as default when no cookie present', () => {
      const mockReq = createMockReq({ path: '/some-page', originalUrl: '/some-page', cookies: {} })

      const middleware = languageMiddleware()
      middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.locals!.lang).toBe('en')
      expect(mockNext).toHaveBeenCalled()
    })

    it('uses language from cookie when present', () => {
      const mockReq = createMockReq({ path: '/some-page', originalUrl: '/some-page', cookies: { lang: 'cy' } })

      const middleware = languageMiddleware()
      middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.locals!.lang).toBe('cy')
    })

    it('ignores invalid language in cookie', () => {
      const mockReq = createMockReq({ path: '/some-page', originalUrl: '/some-page', cookies: { lang: 'invalid' } })

      const middleware = languageMiddleware()
      middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.locals!.lang).toBe('en')
    })

    it('sets up translation helper in locals', () => {
      const mockReq = createMockReq({ path: '/page', originalUrl: '/page' })

      const middleware = languageMiddleware()
      middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.locals!.t).toBeDefined()
      expect(typeof mockRes.locals!.t).toBe('function')
    })

    it('sets up getContent helper in locals', () => {
      const mockReq = createMockReq({ path: '/page', originalUrl: '/page' })

      const middleware = languageMiddleware()
      middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.locals!.getContent).toBeDefined()
      expect(typeof mockRes.locals!.getContent).toBe('function')
    })

    it('sets up getNamespace helper in locals', () => {
      const mockReq = createMockReq({ path: '/page', originalUrl: '/page' })

      const middleware = languageMiddleware()
      middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.locals!.getNamespace).toBeDefined()
      expect(typeof mockRes.locals!.getNamespace).toBe('function')
    })

    it('sets currentPath in locals', () => {
      const mockReq = createMockReq({ path: '/some/path', originalUrl: '/some/path' })

      const middleware = languageMiddleware()
      middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.locals!.currentPath).toBe('/some/path')
    })
  })

  describe('language toggle', () => {
    it('sets up language toggle for English page', () => {
      const mockReq = createMockReq({ path: '/page', originalUrl: '/page', cookies: { lang: 'en' } })

      const middleware = languageMiddleware()
      middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.locals!.languageToggle).toEqual({
        currentLang: 'en',
        switchUrl: '/cy/page',
        switchLang: 'cy',
        switchLabel: 'Cymraeg',
      })
    })

    it('sets up language toggle for Welsh page', () => {
      const mockReq = createMockReq({ path: '/page', originalUrl: '/page', cookies: { lang: 'cy' } })

      const middleware = languageMiddleware()
      middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.locals!.languageToggle).toEqual({
        currentLang: 'cy',
        switchUrl: '/en/page',
        switchLang: 'en',
        switchLabel: 'English',
      })
    })
  })

  describe('session handling', () => {
    it('stores language in session', () => {
      const mockReq = createMockReq({ path: '/page', originalUrl: '/page', cookies: { lang: 'cy' } })

      const middleware = languageMiddleware()
      middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockReq.session!.lang).toBe('cy')
    })

    it('handles missing session gracefully', () => {
      const mockReq = createMockReq({ path: '/page', originalUrl: '/page', session: undefined })

      const middleware = languageMiddleware()

      expect(() => {
        middleware(mockReq as Request, mockRes as Response, mockNext)
      }).not.toThrow()
    })
  })
})

describe('localizedUrl', () => {
  it('returns path with /cy prefix for Welsh', () => {
    expect(localizedUrl('/some-page', 'cy')).toBe('/cy/some-page')
  })

  it('returns path without prefix for English', () => {
    expect(localizedUrl('/some-page', 'en')).toBe('/some-page')
  })

  it('strips existing language prefix before adding new one', () => {
    expect(localizedUrl('/en/some-page', 'cy')).toBe('/cy/some-page')
    expect(localizedUrl('/cy/some-page', 'en')).toBe('/some-page')
  })

  it('handles root path', () => {
    expect(localizedUrl('/', 'cy')).toBe('/cy/')
    expect(localizedUrl('/', 'en')).toBe('/')
  })
})
