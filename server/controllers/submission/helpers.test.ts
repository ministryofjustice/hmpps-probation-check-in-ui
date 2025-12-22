import { Request } from 'express'
import { getSubmissionId, buildPageParams, buildRedirectUrl, buildBackLink } from './helpers'

describe('submission helpers', () => {
  describe('getSubmissionId', () => {
    it('returns submissionId from request params', () => {
      const mockReq = {
        params: { submissionId: 'abc-123-def' },
      } as unknown as Request

      expect(getSubmissionId(mockReq)).toBe('abc-123-def')
    })

    it('returns undefined when submissionId not present', () => {
      const mockReq = {
        params: {},
      } as unknown as Request

      expect(getSubmissionId(mockReq)).toBeUndefined()
    })
  })

  describe('buildPageParams', () => {
    it('returns cya=false when checkAnswers not in query', () => {
      const mockReq = {
        params: { submissionId: 'abc-123' },
        query: {},
        session: { formData: {} },
      } as unknown as Request

      const result = buildPageParams(mockReq)

      expect(result.cya).toBe(false)
    })

    it('returns cya=true when checkAnswers=true in query', () => {
      const mockReq = {
        params: { submissionId: 'abc-123' },
        query: { checkAnswers: 'true' },
        session: { formData: { autoVerifyResult: 'MATCH' } },
      } as unknown as Request

      const result = buildPageParams(mockReq)

      expect(result.cya).toBe(true)
    })

    it('includes submissionId in result', () => {
      const mockReq = {
        params: { submissionId: 'abc-123' },
        query: {},
        session: { formData: {} },
      } as unknown as Request

      const result = buildPageParams(mockReq)

      expect(result.submissionId).toBe('abc-123')
    })

    it('includes autoVerifyResult when cya=true', () => {
      const mockReq = {
        params: { submissionId: 'abc-123' },
        query: { checkAnswers: 'true' },
        session: { formData: { autoVerifyResult: 'NO_MATCH' } },
      } as unknown as Request

      const result = buildPageParams(mockReq)

      expect(result.autoVerifyResult).toBe('NO_MATCH')
    })

    it('returns empty autoVerifyResult when cya=false', () => {
      const mockReq = {
        params: { submissionId: 'abc-123' },
        query: {},
        session: { formData: { autoVerifyResult: 'MATCH' } },
      } as unknown as Request

      const result = buildPageParams(mockReq)

      expect(result.autoVerifyResult).toBe('')
    })

    it('handles missing session formData', () => {
      const mockReq = {
        params: { submissionId: 'abc-123' },
        query: { checkAnswers: 'true' },
        session: {},
      } as unknown as Request

      const result = buildPageParams(mockReq)

      expect(result.autoVerifyResult).toBe('')
    })
  })

  describe('buildRedirectUrl', () => {
    it('returns check-your-answers path when checkAnswers=true', () => {
      const mockReq = {
        params: { submissionId: 'abc-123' },
        query: { checkAnswers: 'true' },
      } as unknown as Request

      const result = buildRedirectUrl(mockReq, '/questions/mental-health')

      expect(result).toBe('/abc-123/check-your-answers')
    })

    it('returns next path when checkAnswers not set', () => {
      const mockReq = {
        params: { submissionId: 'abc-123' },
        query: {},
      } as unknown as Request

      const result = buildRedirectUrl(mockReq, '/questions/mental-health')

      expect(result).toBe('/abc-123/questions/mental-health')
    })

    it('returns next path when checkAnswers=false', () => {
      const mockReq = {
        params: { submissionId: 'abc-123' },
        query: { checkAnswers: 'false' },
      } as unknown as Request

      const result = buildRedirectUrl(mockReq, '/video/record')

      expect(result).toBe('/abc-123/video/record')
    })
  })

  describe('buildBackLink', () => {
    it('returns default path when cya=false', () => {
      const mockReq = {
        params: { submissionId: 'abc-123' },
        query: {},
      } as unknown as Request

      const result = buildBackLink(mockReq, '/verify')

      expect(result).toBe('/abc-123/verify')
    })

    it('returns default path when cya=true but no cyaPath provided', () => {
      const mockReq = {
        params: { submissionId: 'abc-123' },
        query: { checkAnswers: 'true' },
      } as unknown as Request

      const result = buildBackLink(mockReq, '/verify')

      expect(result).toBe('/abc-123/verify')
    })

    it('returns cyaPath when cya=true and cyaPath provided', () => {
      const mockReq = {
        params: { submissionId: 'abc-123' },
        query: { checkAnswers: 'true' },
      } as unknown as Request

      const result = buildBackLink(mockReq, '/verify', '/check-your-answers')

      expect(result).toBe('/abc-123/check-your-answers')
    })

    it('returns default path when cya=false even with cyaPath provided', () => {
      const mockReq = {
        params: { submissionId: 'abc-123' },
        query: {},
      } as unknown as Request

      const result = buildBackLink(mockReq, '/verify', '/check-your-answers')

      expect(result).toBe('/abc-123/verify')
    })
  })
})
