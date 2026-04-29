/* eslint-disable @typescript-eslint/no-explicit-any */
const verifyIdentity = jest.fn()
const getOffenderQuestions = jest.fn()
const autoVerifyCheckinIdentity = jest.fn()

jest.mock('../services', () => ({
  services: jest.fn(() => ({
    esupervisionService: {
      verifyIdentity: (...args: unknown[]) => verifyIdentity(...args),
      getOffenderQuestions: (...args: unknown[]) => getOffenderQuestions(...args),
      autoVerifyCheckinIdentity: (...args: unknown[]) => autoVerifyCheckinIdentity(...args),
    },
  })),
}))

jest.mock('../../logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
}))

// eslint-disable-next-line import/first
import { handleVerify, handleVideoVerify } from './submissionController'

describe('submissionController', () => {
  describe('handleVerify', () => {
    const mockNext = jest.fn()

    const buildReq = (overrides: any = {}) => ({
      params: { submissionId: 'sub-1' },
      body: { firstName: 'John', lastName: 'Doe', day: '14', month: '5', year: '1985' },
      session: { formData: {} },
      ...overrides,
    })

    const buildRes = () => {
      const res: any = {}
      res.render = jest.fn()
      res.redirect = jest.fn()
      res.locals = { checkin: { crn: 'X123456' } }
      return res
    }

    beforeEach(() => {
      jest.clearAllMocks()
      verifyIdentity.mockResolvedValue({ verified: true })
      getOffenderQuestions.mockResolvedValue({ questions: [] })
    })

    it('clears stale liveness/match results from a prior abandoned attempt', async () => {
      const req = buildReq({
        session: {
          formData: {
            autoVerifyResult: 'NO_MATCH',
            isLive: false,
            checkinStartedAt: 123,
          },
        },
      })
      const res = buildRes()

      await handleVerify(req as any, res as any, mockNext)

      expect(req.session.formData.autoVerifyResult).toBeUndefined()
      expect(req.session.formData.isLive).toBeUndefined()
      expect(req.session.formData.checkinStartedAt).toBe(123)
      expect(res.redirect).toHaveBeenCalledWith('/sub-1/questions/mental-health')
    })

    it('leaves session untouched when identity verification fails', async () => {
      verifyIdentity.mockResolvedValueOnce({ verified: false, error: 'mismatch' })
      const req = buildReq({
        session: {
          formData: {
            autoVerifyResult: 'NO_MATCH',
            isLive: false,
          },
        },
      })
      const res = buildRes()

      await handleVerify(req as any, res as any, mockNext)

      expect(req.session.formData.autoVerifyResult).toBe('NO_MATCH')
      expect(req.session.formData.isLive).toBe(false)
      expect(res.render).toHaveBeenCalledWith(
        'pages/submission/no-match-found',
        expect.objectContaining({ submissionId: 'sub-1' }),
      )
    })

    it('is a no-op on a fresh session with no prior attempt', async () => {
      const req = buildReq()
      const res = buildRes()

      await handleVerify(req as any, res as any, mockNext)

      expect(req.session.formData.autoVerifyResult).toBeUndefined()
      expect(req.session.formData.isLive).toBeUndefined()
      expect(res.redirect).toHaveBeenCalledWith('/sub-1/questions/mental-health')
    })
  })

  describe('handleVideoVerify', () => {
    const mockNext = jest.fn()

    const buildReq = (formData: any = {}) => ({
      params: { submissionId: 'sub-1' },
      session: { formData },
    })

    const buildRes = () => {
      const res: any = {}
      res.setHeader = jest.fn()
      res.json = jest.fn()
      return res
    }

    beforeEach(() => {
      jest.clearAllMocks()
    })

    it('writes autoVerifyResult and clears isLive (fallback video means the user is not on the liveness path)', async () => {
      autoVerifyCheckinIdentity.mockResolvedValue({ result: 'MATCH' })
      const req = buildReq({})
      const res = buildRes()

      await handleVideoVerify(req as any, res as any, mockNext)

      expect(req.session.formData.autoVerifyResult).toBe('MATCH')
      expect(req.session.formData).not.toHaveProperty('isLive')
      expect(res.json).toHaveBeenCalledWith({ status: 'SUCCESS', result: 'MATCH' })
    })

    it('clears stale isLive=false from a prior failed liveness attempt within the same session', async () => {
      autoVerifyCheckinIdentity.mockResolvedValue({ result: 'MATCH' })
      const req = buildReq({ autoVerifyResult: 'NO_MATCH', isLive: false })
      const res = buildRes()

      await handleVideoVerify(req as any, res as any, mockNext)

      expect(req.session.formData.autoVerifyResult).toBe('MATCH')
      expect(req.session.formData).not.toHaveProperty('isLive')
    })
  })

  describe('bug scenario: failed liveness then fallback video within the same session', () => {
    const mockNext = jest.fn()

    it('check-answers session state reflects only the fallback result, not the failed liveness', async () => {
      // simulate state left by a failed liveness attempt earlier in this same session
      // (handleLivenessVerify wrote both fields), with no validateIdentity in between
      const session = {
        formData: {
          autoVerifyResult: 'NO_MATCH',
          isLive: false,
          checkinStartedAt: 1000,
        },
      }

      // offender opts for fallback video and passes
      autoVerifyCheckinIdentity.mockResolvedValue({ result: 'MATCH' })
      const videoRes: any = { setHeader: jest.fn(), json: jest.fn() }
      await handleVideoVerify({ params: { submissionId: 'sub-1' }, session } as any, videoRes, mockNext)

      // session should be a clean MATCH with no lingering isLive=false from the failed liveness
      expect(session.formData.autoVerifyResult).toBe('MATCH')
      expect(session.formData).not.toHaveProperty('isLive')
    })
  })

  describe('bug scenario: returning offender skips liveness and uses fallback video after a prior failed liveness', () => {
    const mockNext = jest.fn()

    it('check-answers session state reflects only the new attempt, not the abandoned one', async () => {
      // simulate session state left over from an earlier session in which liveness failed
      const session = {
        formData: {
          autoVerifyResult: 'NO_MATCH',
          isLive: false,
          checkinStartedAt: 1000,
        },
      }

      // 1. offender re-enters identity verification
      verifyIdentity.mockResolvedValue({ verified: true })
      getOffenderQuestions.mockResolvedValue({ questions: [] })

      const verifyRes: any = { render: jest.fn(), redirect: jest.fn(), locals: { checkin: { crn: 'X123456' } } }
      await handleVerify(
        {
          params: { submissionId: 'sub-1' },
          body: { firstName: 'John', lastName: 'Doe', day: '14', month: '5', year: '1985' },
          session,
        } as any,
        verifyRes,
        mockNext,
      )

      // 2. offender takes the fallback video path (no liveness this time)
      autoVerifyCheckinIdentity.mockResolvedValue({ result: 'MATCH' })
      const videoRes: any = { setHeader: jest.fn(), json: jest.fn() }
      await handleVideoVerify({ params: { submissionId: 'sub-1' }, session } as any, videoRes, mockNext)

      // 3. session state used by check-answers.njk should be a clean MATCH with no lingering isLive=false
      expect(session.formData.autoVerifyResult).toBe('MATCH')
      expect(session.formData).not.toHaveProperty('isLive')
    })
  })
})
