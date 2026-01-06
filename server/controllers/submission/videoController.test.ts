import { Request, Response, NextFunction } from 'express'

import { renderVideoInform, renderVideoRecord, handleVideoVerify, renderViewVideo } from './videoController'

jest.mock('../../../logger', () => ({
  info: jest.fn(),
}))

describe('videoController', () => {
  let mockReq: Partial<Request>
  let mockRes: Partial<Response>
  let mockNext: jest.MockedFunction<NextFunction>
  let mockGetCheckinUploadLocation: jest.Mock
  let mockAutoVerifyCheckinIdentity: jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()

    mockGetCheckinUploadLocation = jest.fn()
    mockAutoVerifyCheckinIdentity = jest.fn()

    mockReq = {
      params: { submissionId: 'test-submission-id' },
      query: {},
      session: {
        formData: {},
      } as Request['session'],
    }
    mockRes = {
      render: jest.fn(),
      redirect: jest.fn(),
      json: jest.fn(),
      setHeader: jest.fn(),
      locals: {
        getNamespace: jest.fn(() => ({
          inform: {
            pageTitle: 'Video Instructions',
          },
          record: {
            pageTitle: 'Record Video',
          },
          view: {
            pageTitle: 'View Video',
          },
        })),
        esupervisionService: {
          getCheckinUploadLocation: mockGetCheckinUploadLocation,
          autoVerifyCheckinIdentity: mockAutoVerifyCheckinIdentity,
        },
      } as unknown as Response['locals'],
    }
    mockNext = jest.fn()
  })

  describe('renderVideoInform', () => {
    it('renders video inform page', async () => {
      await renderVideoInform(mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.render).toHaveBeenCalledWith('pages/submission/video/inform', expect.any(Object))
    })

    it('includes page title from content', async () => {
      await renderVideoInform(mockReq as Request, mockRes as Response, mockNext)

      const renderCall = (mockRes.render as jest.Mock).mock.calls[0]
      expect(renderCall[1].pageTitle).toBe('Video Instructions')
    })

    it('includes back link to callback page', async () => {
      await renderVideoInform(mockReq as Request, mockRes as Response, mockNext)

      const renderCall = (mockRes.render as jest.Mock).mock.calls[0]
      expect(renderCall[1].backLink).toBe('/test-submission-id/questions/callback')
    })

    it('includes submissionId', async () => {
      await renderVideoInform(mockReq as Request, mockRes as Response, mockNext)

      const renderCall = (mockRes.render as jest.Mock).mock.calls[0]
      expect(renderCall[1].submissionId).toBe('test-submission-id')
    })

    it('calls next with error on failure', async () => {
      const error = new Error('Test error')
      ;(mockRes.locals!.getNamespace as jest.Mock).mockImplementation(() => {
        throw error
      })

      await renderVideoInform(mockReq as Request, mockRes as Response, mockNext)

      expect(mockNext).toHaveBeenCalledWith(error)
    })
  })

  describe('renderVideoRecord', () => {
    beforeEach(() => {
      mockGetCheckinUploadLocation.mockResolvedValue({
        video: { url: 'https://example.com/video-upload' },
        snapshots: [{ url: 'https://example.com/snapshot1' }, { url: 'https://example.com/snapshot2' }],
      })
    })

    it('renders video record page', async () => {
      await renderVideoRecord(mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.render).toHaveBeenCalledWith('pages/submission/video/record', expect.any(Object))
    })

    it('includes page title from content', async () => {
      await renderVideoRecord(mockReq as Request, mockRes as Response, mockNext)

      const renderCall = (mockRes.render as jest.Mock).mock.calls[0]
      expect(renderCall[1].pageTitle).toBe('Record Video')
    })

    it('includes video upload URL', async () => {
      await renderVideoRecord(mockReq as Request, mockRes as Response, mockNext)

      const renderCall = (mockRes.render as jest.Mock).mock.calls[0]
      expect(renderCall[1].videoUploadUrl).toBe('https://example.com/video-upload')
    })

    it('includes frame upload URLs', async () => {
      await renderVideoRecord(mockReq as Request, mockRes as Response, mockNext)

      const renderCall = (mockRes.render as jest.Mock).mock.calls[0]
      expect(renderCall[1].frameUploadUrl).toEqual(['https://example.com/snapshot1', 'https://example.com/snapshot2'])
    })

    it('includes back link to inform page', async () => {
      await renderVideoRecord(mockReq as Request, mockRes as Response, mockNext)

      const renderCall = (mockRes.render as jest.Mock).mock.calls[0]
      expect(renderCall[1].backLink).toBe('/test-submission-id/video/inform')
    })

    it('calls esupervisionService with correct content types', async () => {
      await renderVideoRecord(mockReq as Request, mockRes as Response, mockNext)

      expect(mockGetCheckinUploadLocation).toHaveBeenCalledWith('test-submission-id', {
        video: 'video/mp4',
        snapshots: ['image/jpeg', 'image/jpeg'],
      })
    })

    it('calls next with error when video upload location is undefined', async () => {
      mockGetCheckinUploadLocation.mockResolvedValue({
        video: undefined,
        snapshots: [{ url: 'https://example.com/snapshot1' }],
      })

      await renderVideoRecord(mockReq as Request, mockRes as Response, mockNext)

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error))
    })

    it('calls next with error when snapshots are empty', async () => {
      mockGetCheckinUploadLocation.mockResolvedValue({
        video: { url: 'https://example.com/video-upload' },
        snapshots: [],
      })

      await renderVideoRecord(mockReq as Request, mockRes as Response, mockNext)

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error))
    })
  })

  describe('handleVideoVerify', () => {
    beforeEach(() => {
      mockAutoVerifyCheckinIdentity.mockResolvedValue({
        result: 'MATCH',
      })
    })

    it('returns success status as JSON', async () => {
      await handleVideoVerify(mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'SUCCESS',
        result: 'MATCH',
      })
    })

    it('stores autoVerifyResult in session', async () => {
      await handleVideoVerify(mockReq as Request, mockRes as Response, mockNext)

      expect(mockReq.session!.formData!.autoVerifyResult).toBe('MATCH')
    })

    it('sets appropriate headers', async () => {
      await handleVideoVerify(mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Type', 'application/json')
      expect(mockRes.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-cache')
      expect(mockRes.setHeader).toHaveBeenCalledWith('Connection', 'keep-alive')
    })

    it('calls esupervisionService with submissionId', async () => {
      await handleVideoVerify(mockReq as Request, mockRes as Response, mockNext)

      expect(mockAutoVerifyCheckinIdentity).toHaveBeenCalledWith('test-submission-id', 1)
    })

    it('returns error status on failure', async () => {
      const error = new Error('Verification failed')
      mockAutoVerifyCheckinIdentity.mockRejectedValue(error)

      await handleVideoVerify(mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'ERROR',
        message: 'Verification failed',
      })
    })
  })

  describe('renderViewVideo', () => {
    it('renders view video page', async () => {
      await renderViewVideo(mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.render).toHaveBeenCalledWith('pages/submission/video/view', expect.any(Object))
    })

    it('includes autoVerifyResult from session', async () => {
      mockReq.session!.formData = { autoVerifyResult: 'MATCH' }

      await renderViewVideo(mockReq as Request, mockRes as Response, mockNext)

      const renderCall = (mockRes.render as jest.Mock).mock.calls[0]
      expect(renderCall[1].autoVerifyResult).toBe('MATCH')
    })

    it('includes back link to record page', async () => {
      await renderViewVideo(mockReq as Request, mockRes as Response, mockNext)

      const renderCall = (mockRes.render as jest.Mock).mock.calls[0]
      expect(renderCall[1].backLink).toBe('/test-submission-id/video/record')
    })

    it('calls next with error on failure', async () => {
      const error = new Error('Test error')
      ;(mockRes.render as jest.Mock).mockImplementation(() => {
        throw error
      })

      await renderViewVideo(mockReq as Request, mockRes as Response, mockNext)

      expect(mockNext).toHaveBeenCalledWith(error)
    })
  })
})
