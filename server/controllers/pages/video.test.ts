import { Request, Response, NextFunction } from 'express'
import { Session } from 'express-session'
import { renderVideoInform, renderVideoRecord, handleVideoVerify, renderVideoView } from './video'
import { PAGES } from '../../config/pages.config'
import VIDEO_CONTENT from '../../config/video.config'

const mockGetCheckinUploadLocation = jest.fn()
const mockAutoVerifyCheckinIdentity = jest.fn()

jest.mock('../../services', () => ({
  services: () => ({
    esupervisionService: {
      getCheckinUploadLocation: (...args: unknown[]) => mockGetCheckinUploadLocation(...args),
      autoVerifyCheckinIdentity: (...args: unknown[]) => mockAutoVerifyCheckinIdentity(...args),
    },
  }),
}))
jest.mock('../../../logger')

describe('Video Controller', () => {
  let req: Partial<Request>
  let res: Partial<Response>
  let next: NextFunction

  beforeEach(() => {
    req = {
      params: { submissionId: 'test-uuid' },
      query: {},
      session: { id: 'test-session-id', formData: {} } as unknown as Session,
    }
    res = {
      locals: {
        user: { username: 'test-user', token: 'test-token', authSource: 'test' },
        checkin: {},
      },
      render: jest.fn(),
      json: jest.fn(),
      setHeader: jest.fn(),
    }
    next = jest.fn()

    jest.clearAllMocks()
  })

  describe('renderVideoInform', () => {
    it('should render video inform page', () => {
      renderVideoInform(req as Request, res as Response, next)

      expect(res.render).toHaveBeenCalledWith('pages/video-inform', {
        pageTitle: PAGES.videoInform.title,
        backLink: '/test-uuid/questions/callback',
        submissionId: 'test-uuid',
        cya: false,
      })
    })
  })

  describe('renderVideoRecord', () => {
    it('should render video record page with upload URLs', async () => {
      const mockUploadLocations = {
        video: { url: 'https://s3.example.com/video' },
        snapshots: [{ url: 'https://s3.example.com/snapshot1' }, { url: 'https://s3.example.com/snapshot2' }],
      }

      mockGetCheckinUploadLocation.mockResolvedValue(mockUploadLocations)

      await renderVideoRecord(req as Request, res as Response, next)

      expect(mockGetCheckinUploadLocation).toHaveBeenCalledWith('test-uuid', {
        video: 'video/mp4',
        snapshots: ['image/jpeg', 'image/jpeg'],
      })

      expect(res.render).toHaveBeenCalledWith('pages/video-record', {
        pageTitle: PAGES.videoRecord.title,
        backLink: '/test-uuid/video/inform',
        videoUploadUrl: 'https://s3.example.com/video',
        frameUploadUrl: ['https://s3.example.com/snapshot1', 'https://s3.example.com/snapshot2'],
        submissionId: 'test-uuid',
        cya: false,
        videoContent: VIDEO_CONTENT,
      })
    })

    it('should call next with error when upload location fails', async () => {
      const error = new Error('Upload location error')
      mockGetCheckinUploadLocation.mockRejectedValue(error)

      await renderVideoRecord(req as Request, res as Response, next)

      expect(next).toHaveBeenCalledWith(error)
    })

    it('should throw error when snapshots are empty', async () => {
      const mockUploadLocations: { video: { url: string }; snapshots: Array<{ url: string }> } = {
        video: { url: 'https://s3.example.com/video' },
        snapshots: [],
      }

      mockGetCheckinUploadLocation.mockResolvedValue(mockUploadLocations)

      await renderVideoRecord(req as Request, res as Response, next)

      expect(next).toHaveBeenCalledWith(expect.any(Error))
    })
  })

  describe('handleVideoVerify', () => {
    it('should return SUCCESS with MATCH result', async () => {
      const mockAutoVerifyResult = { result: 'MATCH' }
      mockAutoVerifyCheckinIdentity.mockResolvedValue(mockAutoVerifyResult)

      await handleVideoVerify(req as Request, res as Response, next)

      expect(mockAutoVerifyCheckinIdentity).toHaveBeenCalledWith('test-uuid', 1)
      expect(req.session.formData.autoVerifyResult).toBe('MATCH')
      expect(res.json).toHaveBeenCalledWith({ status: 'SUCCESS', result: 'MATCH' })
    })

    it('should return ERROR when verification fails', async () => {
      const error = new Error('Verification failed')
      mockAutoVerifyCheckinIdentity.mockRejectedValue(error)

      await handleVideoVerify(req as Request, res as Response, next)

      expect(res.json).toHaveBeenCalledWith({
        status: 'ERROR',
        message: 'Unable to verify video. Please try again.',
        apiErrorUuid: undefined,
      })
    })
  })

  describe('renderVideoView', () => {
    it('should render video view page', () => {
      renderVideoView(req as Request, res as Response, next)

      expect(res.render).toHaveBeenCalledWith('pages/video-view', {
        pageTitle: PAGES.videoView.title,
        backLink: '/test-uuid/video/record',
        autoVerifyResult: '',
        submissionId: 'test-uuid',
        cya: false,
        videoContent: VIDEO_CONTENT,
      })
    })

    it('should include autoVerifyResult when in cya mode', () => {
      req.query = { checkAnswers: 'true' }
      req.session.formData.autoVerifyResult = 'MATCH'

      renderVideoView(req as Request, res as Response, next)

      expect(res.render).toHaveBeenCalledWith('pages/video-view', {
        pageTitle: PAGES.videoView.title,
        backLink: '/test-uuid/check-your-answers',
        autoVerifyResult: 'MATCH',
        submissionId: 'test-uuid',
        cya: true,
        videoContent: VIDEO_CONTENT,
      })
    })
  })
})
