import { Request, Response, NextFunction } from 'express'
import populateValidationErrors from './populateValidationErrors'

describe('populateValidationErrors middleware', () => {
  let mockReq: Partial<Request>
  let mockRes: Partial<Response>
  let mockNext: jest.MockedFunction<NextFunction>

  beforeEach(() => {
    mockReq = {
      flash: jest.fn(),
    }
    mockRes = {
      locals: {} as Response['locals'],
    }
    mockNext = jest.fn()
  })

  it('populates validation errors from flash', async () => {
    const errors = [{ text: 'Error message', href: '#field' }]
    ;(mockReq.flash as jest.Mock).mockReturnValue([JSON.stringify(errors)])

    await populateValidationErrors()(mockReq as Request, mockRes as Response, mockNext)

    expect(mockRes.locals!.validationErrors).toEqual(errors)
  })

  it('does not set validationErrors when flash is empty', async () => {
    ;(mockReq.flash as jest.Mock).mockReturnValue([])

    await populateValidationErrors()(mockReq as Request, mockRes as Response, mockNext)

    expect(mockRes.locals!.validationErrors).toBeUndefined()
  })

  it('calls next()', async () => {
    ;(mockReq.flash as jest.Mock).mockReturnValue([])

    await populateValidationErrors()(mockReq as Request, mockRes as Response, mockNext)

    expect(mockNext).toHaveBeenCalled()
  })

  it('handles complex error objects', async () => {
    const errors = [
      { text: 'First name is required', href: '#firstName' },
      { text: 'Email is invalid', href: '#email' },
      { text: 'Date must be valid', href: '#day' },
    ]
    ;(mockReq.flash as jest.Mock).mockReturnValue([JSON.stringify(errors)])

    await populateValidationErrors()(mockReq as Request, mockRes as Response, mockNext)

    expect(mockRes.locals!.validationErrors).toEqual(errors)
    expect(mockRes.locals!.validationErrors.length).toBe(3)
  })

  it('retrieves validationErrors flash key', async () => {
    ;(mockReq.flash as jest.Mock).mockReturnValue([])

    await populateValidationErrors()(mockReq as Request, mockRes as Response, mockNext)

    expect(mockReq.flash).toHaveBeenCalledWith('validationErrors')
  })
})
