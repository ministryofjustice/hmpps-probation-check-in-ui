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
import { handleLivenessVerify, renderLivenessIndex, renderLivenessOutcome } from './livenessController'

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

    it('clears a stale livenessFallbackAllowed flag from a prior check-in', async () => {
      const req: any = {
        params: { submissionId: 'sub-1' },
        query: {},
        session: { livenessFallbackAllowed: true },
      }
      const res: any = { render: jest.fn() }

      await renderLivenessIndex(req, res, jest.fn())

      expect(req.session.livenessFallbackAllowed).toBeUndefined()
    })
  })

  describe('renderLivenessOutcome', () => {
    it.each(['timeout', 'connection-timeout', 'cancelled', 'error', 'not-live-match', 'live-no-match'])(
      'sets livenessFallbackAllowed for non-match outcome %s',
      async type => {
        const req: any = {
          params: { submissionId: 'sub-1', type },
          query: {},
          session: {},
        }
        const res: any = { render: jest.fn(), status: jest.fn().mockReturnThis() }

        await renderLivenessOutcome(req, res, jest.fn())

        expect(req.session.livenessFallbackAllowed).toBe(true)
        expect(res.render).toHaveBeenCalledWith(
          'pages/submission/liveness/outcome',
          expect.objectContaining({ outcomeType: type }),
        )
      },
    )

    it('does not set livenessFallbackAllowed on a match outcome', async () => {
      const req: any = {
        params: { submissionId: 'sub-1', type: 'match' },
        query: {},
        session: {},
      }
      const res: any = { render: jest.fn(), status: jest.fn().mockReturnThis() }

      await renderLivenessOutcome(req, res, jest.fn())

      expect(req.session.livenessFallbackAllowed).toBeUndefined()
    })

    it('renders 404 for an unknown outcome type without touching the fallback flag', async () => {
      const req: any = {
        params: { submissionId: 'sub-1', type: 'bogus' },
        query: {},
        session: {},
      }
      const res: any = { render: jest.fn(), status: jest.fn().mockReturnThis() }

      await renderLivenessOutcome(req, res, jest.fn())

      expect(res.status).toHaveBeenCalledWith(404)
      expect(req.session.livenessFallbackAllowed).toBeUndefined()
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
