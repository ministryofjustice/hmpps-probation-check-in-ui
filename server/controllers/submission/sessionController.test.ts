import { Request, Response, NextFunction } from 'express'
import { renderTimeout, handleKeepalive } from './sessionController'

jest.mock('../../../logger', () => ({
  info: jest.fn(),
}))

describe('sessionController', () => {
  let mockReq: Partial<Request>
  let mockRes: Partial<Response>
  let mockNext: jest.MockedFunction<NextFunction>

  beforeEach(() => {
    mockReq = {
      params: { submissionId: 'test-submission-id' },
      session: {
        submissionAuthorized: 'test-submission-id',
      } as Request['session'],
    }
    mockRes = {
      render: jest.fn(),
      json: jest.fn(),
      locals: {
        getNamespace: jest.fn(() => ({
          timeout: {
            pageTitle: 'Session Timeout',
          },
        })),
      } as unknown as Response['locals'],
    }
    mockNext = jest.fn()
  })

  describe('renderTimeout', () => {
    it('clears submissionAuthorized from session', async () => {
      await renderTimeout(mockReq as Request, mockRes as Response, mockNext)

      expect(mockReq.session!.submissionAuthorized).toBeUndefined()
    })

    it('renders timeout page', async () => {
      await renderTimeout(mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.render).toHaveBeenCalledWith('pages/submission/timeout', expect.any(Object))
    })

    it('includes submissionId in render params', async () => {
      await renderTimeout(mockReq as Request, mockRes as Response, mockNext)

      const renderCall = (mockRes.render as jest.Mock).mock.calls[0]
      expect(renderCall[1].submissionId).toBe('test-submission-id')
    })

    it('includes pageTitle from content', async () => {
      await renderTimeout(mockReq as Request, mockRes as Response, mockNext)

      const renderCall = (mockRes.render as jest.Mock).mock.calls[0]
      expect(renderCall[1].pageTitle).toBe('Session Timeout')
    })

    it('gets errors namespace from content', async () => {
      await renderTimeout(mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.locals!.getNamespace).toHaveBeenCalledWith('errors')
    })
  })

  describe('handleKeepalive', () => {
    it('returns OK status as JSON', async () => {
      await handleKeepalive(mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.json).toHaveBeenCalledWith({ status: 'OK' })
    })
  })
})
