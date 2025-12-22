import { Request, Response, NextFunction } from 'express'
import { renderIndex, handleStart } from './indexController'

describe('indexController', () => {
  let mockReq: Partial<Request>
  let mockRes: Partial<Response>
  let mockNext: jest.MockedFunction<NextFunction>

  beforeEach(() => {
    mockReq = {
      params: { submissionId: 'test-submission-id' },
      query: {},
      session: {} as Request['session'],
    }
    mockRes = {
      render: jest.fn(),
      redirect: jest.fn(),
      locals: {
        t: jest.fn((key: string) => `translated:${key}`),
      } as unknown as Response['locals'],
    }
    mockNext = jest.fn()
  })

  describe('renderIndex', () => {
    it('initializes form data in session', async () => {
      await renderIndex(mockReq as Request, mockRes as Response, mockNext)

      expect(mockReq.session!.formData).toBeDefined()
      expect(mockReq.session!.formData!.checkinStartedAt).toBeDefined()
    })

    it('renders the index page', async () => {
      await renderIndex(mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.render).toHaveBeenCalledWith('pages/submission/index', expect.any(Object))
    })

    it('includes submissionId in render params', async () => {
      await renderIndex(mockReq as Request, mockRes as Response, mockNext)

      const renderCall = (mockRes.render as jest.Mock).mock.calls[0]
      expect(renderCall[1].submissionId).toBe('test-submission-id')
    })

    it('includes translated pageTitle', async () => {
      await renderIndex(mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.locals!.t).toHaveBeenCalledWith('index.start.pageTitle')
      const renderCall = (mockRes.render as jest.Mock).mock.calls[0]
      expect(renderCall[1].pageTitle).toBe('translated:index.start.pageTitle')
    })

    it('calls next with error on failure', async () => {
      const error = new Error('Test error')
      mockRes.render = jest.fn(() => {
        throw error
      })

      await renderIndex(mockReq as Request, mockRes as Response, mockNext)

      expect(mockNext).toHaveBeenCalledWith(error)
    })
  })

  describe('handleStart', () => {
    it('redirects to verify page', async () => {
      await handleStart(mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.redirect).toHaveBeenCalledWith('/test-submission-id/verify')
    })

    it('uses submissionId from params', async () => {
      mockReq.params = { submissionId: 'different-id' }

      await handleStart(mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.redirect).toHaveBeenCalledWith('/different-id/verify')
    })
  })
})
