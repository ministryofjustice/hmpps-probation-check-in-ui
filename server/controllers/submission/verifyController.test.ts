import { Request, Response, NextFunction } from 'express'

import { renderVerify, handleVerify } from './verifyController'

jest.mock('../../../logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
}))

describe('verifyController', () => {
  let mockReq: Partial<Request>
  let mockRes: Partial<Response>
  let mockNext: jest.MockedFunction<NextFunction>
  let mockVerifyIdentity: jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()

    mockVerifyIdentity = jest.fn()

    mockReq = {
      params: { submissionId: 'test-submission-id' },
      query: {},
      body: {},
      flash: jest.fn().mockReturnValue([]),
      session: {} as Request['session'],
    }
    mockRes = {
      render: jest.fn(),
      redirect: jest.fn(),
      locals: {
        t: jest.fn((key: string) => `translated:${key}`),
        checkin: { crn: 'ABC123' },
        esupervisionService: {
          verifyIdentity: mockVerifyIdentity,
        },
      } as unknown as Response['locals'],
    }
    mockNext = jest.fn()
  })

  describe('renderVerify', () => {
    it('renders verify page', async () => {
      await renderVerify(mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.render).toHaveBeenCalledWith('pages/submission/verify', expect.any(Object))
    })

    it('includes translated page title', async () => {
      await renderVerify(mockReq as Request, mockRes as Response, mockNext)

      const renderCall = (mockRes.render as jest.Mock).mock.calls[0]
      expect(renderCall[1].pageTitle).toBe('translated:verify.pageTitle')
    })

    it('includes submissionId', async () => {
      await renderVerify(mockReq as Request, mockRes as Response, mockNext)

      const renderCall = (mockRes.render as jest.Mock).mock.calls[0]
      expect(renderCall[1].submissionId).toBe('test-submission-id')
    })

    it('includes error message from flash', async () => {
      ;(mockReq.flash as jest.Mock).mockReturnValue(['Error message'])

      await renderVerify(mockReq as Request, mockRes as Response, mockNext)

      const renderCall = (mockRes.render as jest.Mock).mock.calls[0]
      expect(renderCall[1].errorMessage).toBe('Error message')
    })

    it('retrieves error flash key', async () => {
      await renderVerify(mockReq as Request, mockRes as Response, mockNext)

      expect(mockReq.flash).toHaveBeenCalledWith('error')
    })

    it('calls next with error on failure', async () => {
      const error = new Error('Test error')
      ;(mockReq.flash as jest.Mock).mockImplementation(() => {
        throw error
      })

      await renderVerify(mockReq as Request, mockRes as Response, mockNext)

      expect(mockNext).toHaveBeenCalledWith(error)
    })
  })

  describe('handleVerify', () => {
    beforeEach(() => {
      mockReq.body = {
        firstName: 'John',
        lastName: 'Doe',
        day: '15',
        month: '3',
        year: '1990',
      }
      mockVerifyIdentity.mockResolvedValue({ verified: true })
    })

    it('calls verifyIdentity with correct params', async () => {
      await handleVerify(mockReq as Request, mockRes as Response, mockNext)

      expect(mockVerifyIdentity).toHaveBeenCalledWith('test-submission-id', {
        crn: 'ABC123',
        name: {
          forename: 'John',
          surname: 'Doe',
        },
        dateOfBirth: '1990-03-15',
      })
    })

    it('pads month and day with zeros', async () => {
      mockReq.body = {
        firstName: 'John',
        lastName: 'Doe',
        day: '5',
        month: '3',
        year: '1990',
      }

      await handleVerify(mockReq as Request, mockRes as Response, mockNext)

      expect(mockVerifyIdentity).toHaveBeenCalledWith(
        'test-submission-id',
        expect.objectContaining({
          dateOfBirth: '1990-03-05',
        }),
      )
    })

    it('redirects to mental health page on successful verification', async () => {
      await handleVerify(mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.redirect).toHaveBeenCalledWith('/test-submission-id/questions/mental-health')
    })

    it('sets submissionAuthorized in session on success', async () => {
      await handleVerify(mockReq as Request, mockRes as Response, mockNext)

      expect(mockReq.session!.submissionAuthorized).toBe('test-submission-id')
    })

    it('renders no-match-found page when verification fails', async () => {
      mockVerifyIdentity.mockResolvedValue({
        verified: false,
        error: 'Name mismatch',
      })

      await handleVerify(mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.render).toHaveBeenCalledWith('pages/submission/no-match-found', expect.any(Object))
    })

    it('includes user details in no-match-found render', async () => {
      mockVerifyIdentity.mockResolvedValue({ verified: false })

      await handleVerify(mockReq as Request, mockRes as Response, mockNext)

      const renderCall = (mockRes.render as jest.Mock).mock.calls[0]
      expect(renderCall[1].firstName).toBe('John')
      expect(renderCall[1].lastName).toBe('Doe')
      expect(renderCall[1].dateOfBirth).toBe('1990-03-15')
      expect(renderCall[1].submissionId).toBe('test-submission-id')
    })

    it('calls next with error when CRN is missing', async () => {
      mockRes.locals!.checkin = { crn: null }

      await handleVerify(mockReq as Request, mockRes as Response, mockNext)

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error))
    })

    it('calls next with error when verification throws', async () => {
      const error = new Error('API error')
      mockVerifyIdentity.mockRejectedValue(error)

      await handleVerify(mockReq as Request, mockRes as Response, mockNext)

      expect(mockNext).toHaveBeenCalledWith(error)
    })
  })
})
