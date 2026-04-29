/* eslint-disable @typescript-eslint/no-explicit-any */
const verifyLiveness = jest.fn()

jest.mock('../services', () => ({
  services: jest.fn(() => ({
    esupervisionService: {
      verifyLiveness: (...args: unknown[]) => verifyLiveness(...args),
    },
  })),
}))

jest.mock('../../logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
}))

jest.mock('../config', () => ({
  __esModule: true,
  default: { awsRegion: 'eu-west-2' },
}))

// eslint-disable-next-line import/first
import { handleLivenessVerify, renderLivenessIndex } from './livenessController'

describe('livenessController', () => {
  describe('renderLivenessIndex', () => {
    it('wipes any liveness/match state from a prior abandoned attempt', async () => {
      const req: any = {
        params: { submissionId: 'sub-1' },
        query: {},
        session: {
          formData: {
            autoVerifyResult: 'NO_MATCH',
            isLive: false,
            checkinStartedAt: 1000,
          },
        },
      }
      const res: any = { render: jest.fn() }
      const next = jest.fn()

      await renderLivenessIndex(req, res, next)
      expect(next).not.toHaveBeenCalled()

      expect(req.session.formData).not.toHaveProperty('autoVerifyResult')
      expect(req.session.formData).not.toHaveProperty('isLive')
      // checkinStartedAt is reset to a fresh timestamp, not preserved
      expect(typeof req.session.formData.checkinStartedAt).toBe('number')
      expect(req.session.formData.checkinStartedAt).toBeGreaterThan(1000)
      expect(res.render).toHaveBeenCalledWith('pages/submission/liveness/index', expect.any(Object))
    })
  })

  describe('handleLivenessVerify', () => {
    beforeEach(() => {
      jest.clearAllMocks()
    })

    it('writes both autoVerifyResult and isLive (liveness flow has both signals)', async () => {
      verifyLiveness.mockResolvedValue({ result: 'MATCH', isLive: true })
      const req: any = {
        params: { submissionId: 'sub-1' },
        query: { sessionId: 'liveness-session-1' },
        session: { formData: {} },
      }
      const res: any = { setHeader: jest.fn(), json: jest.fn() }

      await handleLivenessVerify(req, res, jest.fn())

      expect(req.session.formData.autoVerifyResult).toBe('MATCH')
      expect(req.session.formData.isLive).toBe(true)
      expect(res.json).toHaveBeenCalledWith({ status: 'SUCCESS', result: 'MATCH', isLive: true })
    })

    it('overwrites stale isLive=false from a prior failed attempt', async () => {
      verifyLiveness.mockResolvedValue({ result: 'MATCH', isLive: true })
      const req: any = {
        params: { submissionId: 'sub-1' },
        query: { sessionId: 'liveness-session-2' },
        session: { formData: { autoVerifyResult: 'NO_MATCH', isLive: false } },
      }
      const res: any = { setHeader: jest.fn(), json: jest.fn() }

      await handleLivenessVerify(req, res, jest.fn())

      expect(req.session.formData.autoVerifyResult).toBe('MATCH')
      expect(req.session.formData.isLive).toBe(true)
    })
  })
})
