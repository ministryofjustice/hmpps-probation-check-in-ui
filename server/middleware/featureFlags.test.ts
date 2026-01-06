import { Request, Response, NextFunction } from 'express'
import featureFlags from './featureFlags'
import { defaultFlags } from '../utils/flags'

describe('featureFlags middleware', () => {
  let mockReq: Partial<Request>
  let mockRes: Partial<Response>
  let mockNext: jest.MockedFunction<NextFunction>

  beforeEach(() => {
    mockReq = {
      signedCookies: {},
      query: {},
    }
    mockRes = {
      locals: {} as Response['locals'],
      cookie: jest.fn(),
    }
    mockNext = jest.fn()
  })

  describe('default flags', () => {
    it('sets default flags when no cookies or query params', () => {
      featureFlags()(mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.locals!.flags).toEqual(defaultFlags)
    })

    it('calls next()', () => {
      featureFlags()(mockReq as Request, mockRes as Response, mockNext)

      expect(mockNext).toHaveBeenCalled()
    })
  })

  describe('cookie-based flags', () => {
    it('reads flags from signed cookie', () => {
      mockReq.signedCookies = {
        'es-feature-flags': { debugMode: 'on' },
      }

      featureFlags()(mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.locals!.flags!.debugMode).toBe(true)
    })

    it('sets flag to false when cookie value is off', () => {
      mockReq.signedCookies = {
        'es-feature-flags': { debugMode: 'off' },
      }

      featureFlags()(mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.locals!.flags!.debugMode).toBe(false)
    })

    it('ignores unknown flags in cookie', () => {
      mockReq.signedCookies = {
        'es-feature-flags': { unknownFlag: 'on' },
      }

      featureFlags()(mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.locals!.flags).toEqual(defaultFlags)
      expect((mockRes.locals!.flags as Record<string, unknown>).unknownFlag).toBeUndefined()
    })

    it('handles missing signed cookies gracefully', () => {
      mockReq.signedCookies = undefined

      featureFlags()(mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.locals!.flags).toEqual(defaultFlags)
    })
  })

  describe('query string overrides', () => {
    it('overrides flags from query params with es- prefix', () => {
      mockReq.query = { 'es-debugMode': 'on' }

      featureFlags()(mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.locals!.flags!.debugMode).toBe(true)
    })

    it('sets flag to false from query param', () => {
      mockReq.signedCookies = {
        'es-feature-flags': { debugMode: 'on' },
      }
      mockReq.query = { 'es-debugMode': 'off' }

      featureFlags()(mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.locals!.flags!.debugMode).toBe(false)
    })

    it('ignores query params without es- prefix', () => {
      mockReq.query = { debugMode: 'on' }

      featureFlags()(mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.locals!.flags!.debugMode).toBe(false)
    })

    it('ignores unknown flags in query params', () => {
      mockReq.query = { 'es-unknownFlag': 'on' }

      featureFlags()(mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.locals!.flags).toEqual(defaultFlags)
    })

    it('ignores invalid values in query params', () => {
      mockReq.query = { 'es-debugMode': 'invalid' }

      featureFlags()(mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.locals!.flags!.debugMode).toBe(false)
    })

    it('is case insensitive for on/off values', () => {
      mockReq.query = { 'es-debugMode': 'ON' }

      featureFlags()(mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.locals!.flags!.debugMode).toBe(true)
    })
  })

  describe('cookie persistence', () => {
    it('sets cookie when query param overrides exist', () => {
      mockReq.query = { 'es-debugMode': 'on' }

      featureFlags()(mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.cookie).toHaveBeenCalledWith(
        'es-feature-flags',
        { debugMode: 'on' },
        {
          httpOnly: true,
          sameSite: 'lax',
          signed: true,
          maxAge: expect.any(Number),
        },
      )
    })

    it('merges cookie and query param overrides when setting cookie', () => {
      mockReq.signedCookies = {
        'es-feature-flags': { debugMode: 'off' },
      }
      mockReq.query = { 'es-debugMode': 'on' }

      featureFlags()(mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.cookie).toHaveBeenCalledWith('es-feature-flags', { debugMode: 'on' }, expect.any(Object))
    })

    it('does not set cookie when no query param overrides', () => {
      mockReq.signedCookies = {
        'es-feature-flags': { debugMode: 'on' },
      }

      featureFlags()(mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.cookie).not.toHaveBeenCalled()
    })
  })
})
