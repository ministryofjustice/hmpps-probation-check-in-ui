import { Request, Response, NextFunction } from 'express'
import populateValidationErrors from './populateValidationErrors'

describe('populateValidationErrors middleware', () => {
  let mockReq: Partial<Request>
  let mockRes: Partial<Response>
  let mockNext: jest.MockedFunction<NextFunction>

  const createFlashMock = (validationErrors: string[] = [], formBody: string[] = []) => {
    return jest.fn((key: string) => {
      if (key === 'validationErrors') return validationErrors
      if (key === 'formBody') return formBody
      return []
    }) as unknown as Request['flash']
  }

  beforeEach(() => {
    mockReq = {
      flash: createFlashMock(),
    }
    mockRes = {
      locals: { formData: {} } as unknown as Response['locals'],
    }
    mockNext = jest.fn()
  })

  it('populates validation errors from flash', async () => {
    const errors = [{ text: 'Error message', href: '#field' }]
    mockReq.flash = createFlashMock([JSON.stringify(errors)])

    await populateValidationErrors()(mockReq as Request, mockRes as Response, mockNext)

    expect(mockRes.locals!.validationErrors).toEqual(errors)
  })

  it('does not set validationErrors when flash is empty', async () => {
    mockReq.flash = createFlashMock()

    await populateValidationErrors()(mockReq as Request, mockRes as Response, mockNext)

    expect(mockRes.locals!.validationErrors).toBeUndefined()
  })

  it('calls next()', async () => {
    mockReq.flash = createFlashMock()

    await populateValidationErrors()(mockReq as Request, mockRes as Response, mockNext)

    expect(mockNext).toHaveBeenCalled()
  })

  it('handles complex error objects', async () => {
    const errors = [
      { text: 'First name is required', href: '#firstName' },
      { text: 'Email is invalid', href: '#email' },
      { text: 'Date must be valid', href: '#day' },
    ]
    mockReq.flash = createFlashMock([JSON.stringify(errors)])

    await populateValidationErrors()(mockReq as Request, mockRes as Response, mockNext)

    expect(mockRes.locals!.validationErrors).toEqual(errors)
    expect(mockRes.locals!.validationErrors.length).toBe(3)
  })

  it('retrieves validationErrors flash key', async () => {
    mockReq.flash = createFlashMock()

    await populateValidationErrors()(mockReq as Request, mockRes as Response, mockNext)

    expect(mockReq.flash).toHaveBeenCalledWith('validationErrors')
  })

  describe('form body restoration', () => {
    it('restores form body from flash to formData', async () => {
      const formBody = { firstName: 'John', lastName: 'Doe' }
      mockReq.flash = createFlashMock([], [JSON.stringify(formBody)])

      await populateValidationErrors()(mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.locals!.formData).toEqual({ firstName: 'John', lastName: 'Doe' })
    })

    it('merges form body with existing formData', async () => {
      const formBody = { firstName: 'John' }
      mockRes.locals = { formData: { existingField: 'value' } } as unknown as Response['locals']
      mockReq.flash = createFlashMock([], [JSON.stringify(formBody)])

      await populateValidationErrors()(mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.locals!.formData).toEqual({ existingField: 'value', firstName: 'John' })
    })

    it('overrides existing formData values with flashed values', async () => {
      const formBody = { firstName: 'NewName' }
      mockRes.locals = { formData: { firstName: 'OldName' } } as unknown as Response['locals']
      mockReq.flash = createFlashMock([], [JSON.stringify(formBody)])

      await populateValidationErrors()(mockReq as Request, mockRes as Response, mockNext)

      expect((mockRes.locals!.formData as Record<string, string>).firstName).toBe('NewName')
    })

    it('does not modify formData when formBody flash is empty', async () => {
      mockRes.locals = { formData: { existingField: 'value' } } as unknown as Response['locals']
      mockReq.flash = createFlashMock()

      await populateValidationErrors()(mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.locals!.formData).toEqual({ existingField: 'value' })
    })

    it('retrieves formBody flash key', async () => {
      mockReq.flash = createFlashMock()

      await populateValidationErrors()(mockReq as Request, mockRes as Response, mockNext)

      expect(mockReq.flash).toHaveBeenCalledWith('formBody')
    })
  })
})
