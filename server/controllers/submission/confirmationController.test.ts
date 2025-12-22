import { Request, Response, NextFunction } from 'express'
import { renderConfirmation } from './confirmationController'

describe('confirmationController', () => {
  let mockReq: Partial<Request>
  let mockRes: Partial<Response>
  let mockNext: jest.MockedFunction<NextFunction>

  beforeEach(() => {
    mockReq = {
      params: { submissionId: 'test-submission-id' },
      query: {},
      session: {
        formData: { mentalHealth: 'WELL' },
        destroy: jest.fn((cb: () => void) => cb()),
      } as unknown as Request['session'],
    }
    mockRes = {
      render: jest.fn(),
      locals: {
        getNamespace: jest.fn(() => ({ pageTitle: 'Confirmation Page' })),
      } as unknown as Response['locals'],
    }
    mockNext = jest.fn()
  })

  describe('renderConfirmation', () => {
    it('clears session data', async () => {
      await renderConfirmation(mockReq as Request, mockRes as Response, mockNext)

      expect(mockReq.session!.destroy).toHaveBeenCalled()
    })

    it('renders the confirmation page', async () => {
      await renderConfirmation(mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.render).toHaveBeenCalledWith('pages/submission/confirmation', expect.any(Object))
    })

    it('gets confirmation content from namespace', async () => {
      await renderConfirmation(mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.locals!.getNamespace).toHaveBeenCalledWith('confirmation')
    })

    it('includes pageTitle from content', async () => {
      await renderConfirmation(mockReq as Request, mockRes as Response, mockNext)

      const renderCall = (mockRes.render as jest.Mock).mock.calls[0]
      expect(renderCall[1].pageTitle).toBe('Confirmation Page')
    })

    it('includes submissionId in render params', async () => {
      await renderConfirmation(mockReq as Request, mockRes as Response, mockNext)

      const renderCall = (mockRes.render as jest.Mock).mock.calls[0]
      expect(renderCall[1].submissionId).toBe('test-submission-id')
    })

    it('calls next with error on failure', async () => {
      const error = new Error('Test error')
      ;(mockRes.locals!.getNamespace as jest.Mock).mockImplementation(() => {
        throw error
      })

      await renderConfirmation(mockReq as Request, mockRes as Response, mockNext)

      expect(mockNext).toHaveBeenCalledWith(error)
    })
  })
})
