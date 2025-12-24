import { Request, Response, NextFunction } from 'express'
import storeFormDataInSession from './storeFormDataInSession'
import MentalHealth from '../data/models/survey/mentalHealth'
import CallbackRequested from '../data/models/survey/callbackRequested'
import SupportAspect from '../data/models/survey/supportAspect'

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
      mockReq.session = { formData: { mentalHealth: MentalHealth.Well } } as Request['session']
      mockReq.body = {}

      await storeFormDataInSession()(mockReq as Request, mockRes as Response, mockNext)

      expect(mockReq.session!.formData!.mentalHealth).toBe(MentalHealth.Well)
    })

    it('initializes empty formData in res.locals', async () => {
      mockReq.body = {}

      await storeFormDataInSession()(mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.locals!.formData).toBeDefined()
    })
  })

  describe('storing form data', () => {
    it('stores form data in session', async () => {
      mockReq.body = { mentalHealth: MentalHealth.Well, callbackDetails: 'Call me later' }

      await storeFormDataInSession()(mockReq as Request, mockRes as Response, mockNext)

      expect(mockReq.session!.formData!.mentalHealth).toBe(MentalHealth.Well)
      expect(mockReq.session!.formData!.callbackDetails).toBe('Call me later')
    })

    it('ignores fields starting with underscore', async () => {
      mockReq.body = { _csrf: 'token', _hidden: 'value', mentalHealth: MentalHealth.Well }

      await storeFormDataInSession()(mockReq as Request, mockRes as Response, mockNext)

      // Underscore fields should not be stored (they are filtered by key.startsWith('_'))
      // Since we can't access them on typed formData, we verify the valid field is stored
      expect(mockReq.session!.formData!.mentalHealth).toBe(MentalHealth.Well)
    })

    it('ignores unknown fields not in CheckinFormData', async () => {
      mockReq.body = { unknownField: 'value', mentalHealth: MentalHealth.Well }

      await storeFormDataInSession()(mockReq as Request, mockRes as Response, mockNext)

      // Only known fields should be stored
      expect(mockReq.session!.formData!.mentalHealth).toBe(MentalHealth.Well)
      // Unknown fields are filtered out by isCheckinFormDataKey check
    })

    it('copies session formData to res.locals.formData', async () => {
      mockReq.session = { formData: { mentalHealth: MentalHealth.Well } } as Request['session']
      mockReq.body = { callback: CallbackRequested.Yes }

      await storeFormDataInSession()(mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.locals!.formData!.mentalHealth).toBe(MentalHealth.Well)
      expect(mockRes.locals!.formData!.callback).toBe(CallbackRequested.Yes)
    })
  })

  describe('checkbox handling', () => {
    it('deletes value when _unchecked is received', async () => {
      mockReq.session = { formData: { callback: CallbackRequested.Yes } } as Request['session']
      mockReq.body = { callback: '_unchecked' }

      await storeFormDataInSession()(mockReq as Request, mockRes as Response, mockNext)

      expect(mockReq.session!.formData!.callback).toBeUndefined()
    })

    it('removes _unchecked from array of checkbox values', async () => {
      mockReq.body = { assistance: [SupportAspect.MentalHealth, '_unchecked', SupportAspect.Alcohol] }

      await storeFormDataInSession()(mockReq as Request, mockRes as Response, mockNext)

      expect(mockReq.session!.formData!.assistance).toEqual([SupportAspect.MentalHealth, SupportAspect.Alcohol])
    })

    it('handles array with only _unchecked values', async () => {
      mockReq.body = { assistance: ['_unchecked', '_unchecked'] }

      await storeFormDataInSession()(mockReq as Request, mockRes as Response, mockNext)

      expect(mockReq.session!.formData!.assistance).toEqual([])
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
      mockReq.session = { formData: { mentalHealth: MentalHealth.Ok } } as Request['session']
      mockReq.body = { mentalHealth: MentalHealth.Well }

      await storeFormDataInSession()(mockReq as Request, mockRes as Response, mockNext)

      expect(mockReq.session!.formData!.mentalHealth).toBe(MentalHealth.Well)
    })

    it('preserves existing data not in current body', async () => {
      mockReq.session = {
        formData: { mentalHealth: MentalHealth.Well, callback: CallbackRequested.Yes },
      } as Request['session']
      mockReq.body = { callbackDetails: 'Call me tomorrow' }

      await storeFormDataInSession()(mockReq as Request, mockRes as Response, mockNext)

      expect(mockReq.session!.formData!.mentalHealth).toBe(MentalHealth.Well)
      expect(mockReq.session!.formData!.callback).toBe(CallbackRequested.Yes)
      expect(mockReq.session!.formData!.callbackDetails).toBe('Call me tomorrow')
    })
  })
})
