import { Request, Response, NextFunction } from 'express'
import storeFormDataInSession from './storeFormDataInSession'

describe('storeFormDataInSession middleware', () => {
  let mockReq: Partial<Request>
  let mockRes: Partial<Response>
  let mockNext: jest.MockedFunction<NextFunction>

  beforeEach(() => {
    mockReq = {
      body: {},
      session: {
        formData: {},
      } as Request['session'],
    }
    mockRes = {
      locals: {} as Response['locals'],
    }
    mockNext = jest.fn()
  })

  describe('session initialization', () => {
    it('initializes formData in session if not present', async () => {
      mockReq.session = {} as Request['session']
      mockReq.body = {}

      await storeFormDataInSession()(mockReq as Request, mockRes as Response, mockNext)

      expect(mockReq.session!.formData).toEqual({})
    })

    it('preserves existing formData in session', async () => {
      mockReq.session = { formData: { mentalHealth: 'WELL' } } as Request['session']
      mockReq.body = {}

      await storeFormDataInSession()(mockReq as Request, mockRes as Response, mockNext)

      expect(mockReq.session!.formData!.mentalHealth).toBe('WELL')
    })

    it('initializes empty formData in res.locals', async () => {
      mockReq.body = {}

      await storeFormDataInSession()(mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.locals!.formData).toBeDefined()
    })
  })

  describe('storing form data', () => {
    it('stores form data in session', async () => {
      mockReq.body = { name: 'John', email: 'john@example.com' }

      await storeFormDataInSession()(mockReq as Request, mockRes as Response, mockNext)

      expect(mockReq.session!.formData!.name).toBe('John')
      expect(mockReq.session!.formData!.email).toBe('john@example.com')
    })

    it('ignores fields starting with underscore', async () => {
      mockReq.body = { _csrf: 'token', _hidden: 'value', name: 'John' }

      await storeFormDataInSession()(mockReq as Request, mockRes as Response, mockNext)
      /* eslint-disable no-underscore-dangle */
      expect(mockReq.session!.formData!._csrf).toBeUndefined()
      expect(mockReq.session!.formData!._hidden).toBeUndefined()
      /* eslint-enable no-underscore-dangle */
      expect(mockReq.session!.formData!.name).toBe('John')
    })

    it('copies session formData to res.locals.formData', async () => {
      mockReq.session = { formData: { mentalHealth: 'WELL' } } as Request['session']
      mockReq.body = { callback: 'YES' }

      await storeFormDataInSession()(mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.locals!.formData!.mentalHealth).toBe('WELL')
      expect(mockRes.locals!.formData!.callback).toBe('YES')
    })
  })

  describe('checkbox handling', () => {
    it('deletes value when _unchecked is received', async () => {
      mockReq.session = { formData: { callback: 'YES' } } as Request['session']
      mockReq.body = { callback: '_unchecked' }

      await storeFormDataInSession()(mockReq as Request, mockRes as Response, mockNext)

      expect(mockReq.session!.formData!.callback).toBeUndefined()
    })

    it('removes _unchecked from array of checkbox values', async () => {
      mockReq.body = { options: ['option1', '_unchecked', 'option2'] }

      await storeFormDataInSession()(mockReq as Request, mockRes as Response, mockNext)

      expect(mockReq.session!.formData!.options).toEqual(['option1', 'option2'])
    })

    it('handles array with only _unchecked values', async () => {
      mockReq.body = { options: ['_unchecked', '_unchecked'] }

      await storeFormDataInSession()(mockReq as Request, mockRes as Response, mockNext)

      expect(mockReq.session!.formData!.options).toEqual([])
    })
  })

  describe('middleware behavior', () => {
    it('calls next()', async () => {
      await storeFormDataInSession()(mockReq as Request, mockRes as Response, mockNext)

      expect(mockNext).toHaveBeenCalled()
    })

    it('handles empty body', async () => {
      mockReq.body = undefined

      await storeFormDataInSession()(mockReq as Request, mockRes as Response, mockNext)

      expect(mockNext).toHaveBeenCalled()
    })

    it('handles null body', async () => {
      mockReq.body = null

      await storeFormDataInSession()(mockReq as Request, mockRes as Response, mockNext)

      expect(mockNext).toHaveBeenCalled()
    })
  })

  describe('overwriting existing data', () => {
    it('overwrites existing session data with new values', async () => {
      mockReq.session = { formData: { mentalHealth: 'OK' } } as Request['session']
      mockReq.body = { mentalHealth: 'WELL' }

      await storeFormDataInSession()(mockReq as Request, mockRes as Response, mockNext)

      expect(mockReq.session!.formData!.mentalHealth).toBe('WELL')
    })

    it('preserves existing data not in current body', async () => {
      mockReq.session = { formData: { mentalHealth: 'WELL', callback: 'YES' } } as Request['session']
      mockReq.body = { callbackDetails: 'Call me tomorrow' }

      await storeFormDataInSession()(mockReq as Request, mockRes as Response, mockNext)

      expect(mockReq.session!.formData!.mentalHealth).toBe('WELL')
      expect(mockReq.session!.formData!.callback).toBe('YES')
      expect(mockReq.session!.formData!.callbackDetails).toBe('Call me tomorrow')
    })
  })
})
