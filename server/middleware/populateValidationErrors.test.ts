import { Request, Response, NextFunction } from 'express'
import populateValidationErrors from './populateValidationErrors'
import { CheckinFormData } from '../data/models/formData'
import MentalHealth from '../data/models/survey/mentalHealth'

describe('populateValidationErrors middleware', () => {
  let mockReq: Partial<Request>
  let mockRes: Partial<Response>
  let mockNext: jest.MockedFunction<NextFunction>

  /**
   * Creates a flash mock that returns configured values based on key.
   */
  function createFlashMock(validationErrors: string[] = [], formBody: string[] = []) {
    return (key: string): string[] => {
      if (key === 'validationErrors') return validationErrors
      if (key === 'formBody') return formBody
      return []
    }
  }

  beforeEach(() => {
    mockReq = {
      flash: jest.fn(),
    }
    mockRes = {
      locals: {
        formData: {},
      } as Response['locals'],
    }
    mockNext = jest.fn()
  })

  it('populates validation errors from flash', async () => {
    const errors = [{ text: 'Error message', href: '#field' }]
    const flashMock = createFlashMock([JSON.stringify(errors)])
    mockReq.flash = jest.fn().mockImplementation(flashMock)

    await populateValidationErrors()(mockReq as Request, mockRes as Response, mockNext)

    expect(mockRes.locals!.validationErrors).toEqual(errors)
  })

  it('does not set validationErrors when flash is empty', async () => {
    const flashMock = createFlashMock()
    mockReq.flash = jest.fn().mockImplementation(flashMock)

    await populateValidationErrors()(mockReq as Request, mockRes as Response, mockNext)

    expect(mockRes.locals!.validationErrors).toBeUndefined()
  })

  it('calls next()', async () => {
    const flashMock = createFlashMock()
    mockReq.flash = jest.fn().mockImplementation(flashMock)

    await populateValidationErrors()(mockReq as Request, mockRes as Response, mockNext)

    expect(mockNext).toHaveBeenCalled()
  })

  it('handles complex error objects', async () => {
    const errors = [
      { text: 'First name is required', href: '#firstName' },
      { text: 'Email is invalid', href: '#email' },
      { text: 'Date must be valid', href: '#day' },
    ]
    const flashMock = createFlashMock([JSON.stringify(errors)])
    mockReq.flash = jest.fn().mockImplementation(flashMock)

    await populateValidationErrors()(mockReq as Request, mockRes as Response, mockNext)

    expect(mockRes.locals!.validationErrors).toEqual(errors)
    expect(mockRes.locals!.validationErrors.length).toBe(3)
  })

  it('retrieves validationErrors flash key', async () => {
    const flashMock = createFlashMock()
    mockReq.flash = jest.fn().mockImplementation(flashMock)

    await populateValidationErrors()(mockReq as Request, mockRes as Response, mockNext)

    expect(mockReq.flash).toHaveBeenCalledWith('validationErrors')
  })

  describe('form data restoration', () => {
    it('restores verify form data to formData', async () => {
      const formBody = { firstName: 'John', lastName: 'Doe' }
      const flashMock = createFlashMock([], [JSON.stringify(formBody)])
      mockReq.flash = jest.fn().mockImplementation(flashMock)

      await populateValidationErrors()(mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.locals!.formData).toEqual({ firstName: 'John', lastName: 'Doe' })
    })

    it('restores all verify form fields', async () => {
      const formBody = {
        firstName: 'John',
        lastName: 'Doe',
        day: '15',
        month: '06',
        year: '1990',
      }
      const flashMock = createFlashMock([], [JSON.stringify(formBody)])
      mockReq.flash = jest.fn().mockImplementation(flashMock)

      await populateValidationErrors()(mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.locals!.formData).toEqual(formBody)
    })

    it('does not modify formData when formBody flash is empty', async () => {
      const flashMock = createFlashMock()
      mockReq.flash = jest.fn().mockImplementation(flashMock)

      await populateValidationErrors()(mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.locals!.formData).toEqual({})
    })

    it('restores checkin form data to formData', async () => {
      const formBody: CheckinFormData = { mentalHealth: MentalHealth.Well }
      const flashMock = createFlashMock([], [JSON.stringify(formBody)])
      mockReq.flash = jest.fn().mockImplementation(flashMock)

      await populateValidationErrors()(mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.locals!.formData).toEqual({ mentalHealth: MentalHealth.Well })
    })

    it('merges checkin form body with existing formData', async () => {
      const formBody: CheckinFormData = { mentalHealth: MentalHealth.Ok }
      mockRes.locals = { formData: { callbackDetails: 'existing value' } } as Response['locals']
      const flashMock = createFlashMock([], [JSON.stringify(formBody)])
      mockReq.flash = jest.fn().mockImplementation(flashMock)

      await populateValidationErrors()(mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.locals!.formData).toEqual({
        callbackDetails: 'existing value',
        mentalHealth: MentalHealth.Ok,
      })
    })

    it('overrides existing formData values with flashed values', async () => {
      const formBody: CheckinFormData = { mentalHealth: MentalHealth.Struggling }
      mockRes.locals = { formData: { mentalHealth: MentalHealth.Well } } as Response['locals']
      const flashMock = createFlashMock([], [JSON.stringify(formBody)])
      mockReq.flash = jest.fn().mockImplementation(flashMock)

      await populateValidationErrors()(mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.locals!.formData!.mentalHealth).toBe(MentalHealth.Struggling)
    })

    it('does not modify formData when formBody flash is empty', async () => {
      mockRes.locals = { formData: { callbackDetails: 'existing value' } } as Response['locals']
      const flashMock = createFlashMock()
      mockReq.flash = jest.fn().mockImplementation(flashMock)

      await populateValidationErrors()(mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.locals!.formData).toEqual({ callbackDetails: 'existing value' })
    })
  })

  it('retrieves formBody flash key', async () => {
    const flashMock = createFlashMock()
    mockReq.flash = jest.fn().mockImplementation(flashMock)

    await populateValidationErrors()(mockReq as Request, mockRes as Response, mockNext)

    expect(mockReq.flash).toHaveBeenCalledWith('formBody')
  })
})
