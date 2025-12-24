import { Request, Response, NextFunction } from 'express'

import { renderCheckAnswers, handleSubmission } from './checkAnswersController'
import MentalHealth from '../../data/models/survey/mentalHealth'
import CallbackRequested from '../../data/models/survey/callbackRequested'
import SupportAspect from '../../data/models/survey/supportAspect'

jest.mock('../../../logger', () => ({
  error: jest.fn(),
}))

describe('checkAnswersController', () => {
  let mockReq: Partial<Request>
  let mockRes: Partial<Response>
  let mockNext: jest.MockedFunction<NextFunction>
  let mockSubmitCheckin: jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()

    mockSubmitCheckin = jest.fn()

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
      locals: {
        t: jest.fn((key: string) => `translated:${key}`),
        getNamespace: jest.fn(() => ({
          pageTitle: 'Check Your Answers',
          sections: { video: 'Video Section' },
          confirm: { title: 'Confirm' },
          submitButton: 'Submit',
        })),
        formData: {
          mentalHealth: MentalHealth.Well,
          assistance: [SupportAspect.MentalHealth, SupportAspect.Alcohol],
          mentalHealthSupport: 'Need help with anxiety',
          alcoholSupport: 'Cutting back',
          callback: CallbackRequested.Yes,
          callbackDetails: 'Please call in afternoon',
          autoVerifyResult: 'MATCH',
        },
        esupervisionService: {
          submitCheckin: mockSubmitCheckin,
        },
      } as unknown as Response['locals'],
    }
    mockNext = jest.fn()
  })

  describe('renderCheckAnswers', () => {
    it('renders check answers page', async () => {
      await renderCheckAnswers(mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.render).toHaveBeenCalledWith('pages/submission/check-answers', expect.any(Object))
    })

    it('includes page title from content', async () => {
      await renderCheckAnswers(mockReq as Request, mockRes as Response, mockNext)

      const renderCall = (mockRes.render as jest.Mock).mock.calls[0]
      expect(renderCall[1].pageTitle).toBe('Check Your Answers')
    })

    it('includes back link to video view', async () => {
      await renderCheckAnswers(mockReq as Request, mockRes as Response, mockNext)

      const renderCall = (mockRes.render as jest.Mock).mock.calls[0]
      expect(renderCall[1].backLink).toBe('/test-submission-id/video/view')
    })

    it('includes submissionId', async () => {
      await renderCheckAnswers(mockReq as Request, mockRes as Response, mockNext)

      const renderCall = (mockRes.render as jest.Mock).mock.calls[0]
      expect(renderCall[1].submissionId).toBe('test-submission-id')
    })

    it('builds summary rows with mental health', async () => {
      await renderCheckAnswers(mockReq as Request, mockRes as Response, mockNext)

      const renderCall = (mockRes.render as jest.Mock).mock.calls[0]
      const mentalHealthRow = renderCall[1].summaryRows.find(
        (row: Record<string, unknown>) =>
          (row.key as Record<string, unknown>).text === 'translated:checkAnswers.rows.mentalHealth.key',
      )
      expect(mentalHealthRow).toBeDefined()
      expect(mentalHealthRow.value.text).toBe('Well')
    })

    it('builds summary rows with assistance', async () => {
      await renderCheckAnswers(mockReq as Request, mockRes as Response, mockNext)

      const renderCall = (mockRes.render as jest.Mock).mock.calls[0]
      const assistanceRow = renderCall[1].summaryRows.find(
        (row: Record<string, unknown>) =>
          (row.key as Record<string, unknown>).text === 'translated:checkAnswers.rows.assistance.key',
      )
      expect(assistanceRow).toBeDefined()
      expect(assistanceRow.value.text).toContain('Mental health')
      expect(assistanceRow.value.text).toContain('Alcohol')
    })

    it('builds summary rows with support details', async () => {
      await renderCheckAnswers(mockReq as Request, mockRes as Response, mockNext)

      const renderCall = (mockRes.render as jest.Mock).mock.calls[0]
      const mentalHealthSupportRow = renderCall[1].summaryRows.find(
        (row: Record<string, unknown>) =>
          (row.key as Record<string, unknown>).text === 'translated:checkAnswers.rows.mentalHealthSupport.key',
      )
      expect(mentalHealthSupportRow).toBeDefined()
      expect(mentalHealthSupportRow.value.text).toBe('Need help with anxiety')
    })

    it('builds summary rows with callback', async () => {
      await renderCheckAnswers(mockReq as Request, mockRes as Response, mockNext)

      const renderCall = (mockRes.render as jest.Mock).mock.calls[0]
      const callbackRow = renderCall[1].summaryRows.find(
        (row: Record<string, unknown>) =>
          (row.key as Record<string, unknown>).text === 'translated:checkAnswers.rows.callback.key',
      )
      expect(callbackRow).toBeDefined()
      expect(callbackRow.value.text).toBe('Yes')
    })

    it('builds summary rows with callback details when callback is YES', async () => {
      await renderCheckAnswers(mockReq as Request, mockRes as Response, mockNext)

      const renderCall = (mockRes.render as jest.Mock).mock.calls[0]
      const callbackDetailsRow = renderCall[1].summaryRows.find(
        (row: Record<string, unknown>) =>
          (row.key as Record<string, unknown>).text === 'translated:checkAnswers.rows.callbackDetails.key',
      )
      expect(callbackDetailsRow).toBeDefined()
      expect(callbackDetailsRow.value.text).toBe('Please call in afternoon')
    })

    it('does not include callback details when callback is NO', async () => {
      mockRes.locals!.formData!.callback = CallbackRequested.No
      mockRes.locals!.formData!.callbackDetails = undefined

      await renderCheckAnswers(mockReq as Request, mockRes as Response, mockNext)

      const renderCall = (mockRes.render as jest.Mock).mock.calls[0]
      const callbackDetailsRow = renderCall[1].summaryRows.find(
        (row: Record<string, unknown>) =>
          (row.key as Record<string, unknown>).text === 'translated:checkAnswers.rows.callbackDetails.key',
      )
      expect(callbackDetailsRow).toBeUndefined()
    })

    it('builds video rows with MATCH status', async () => {
      await renderCheckAnswers(mockReq as Request, mockRes as Response, mockNext)

      const renderCall = (mockRes.render as jest.Mock).mock.calls[0]
      const videoRow = renderCall[1].videoRows[0]
      expect(videoRow.value.text).toBe('translated:checkAnswers.rows.videoCheck.match')
    })

    it('builds video rows with NO_MATCH status', async () => {
      mockRes.locals!.formData!.autoVerifyResult = 'NO_MATCH'

      await renderCheckAnswers(mockReq as Request, mockRes as Response, mockNext)

      const renderCall = (mockRes.render as jest.Mock).mock.calls[0]
      const videoRow = renderCall[1].videoRows[0]
      expect(videoRow.value.text).toBe('translated:checkAnswers.rows.videoCheck.noMatch')
    })

    it('includes change links in summary rows', async () => {
      await renderCheckAnswers(mockReq as Request, mockRes as Response, mockNext)

      const renderCall = (mockRes.render as jest.Mock).mock.calls[0]
      const mentalHealthRow = renderCall[1].summaryRows[0]
      expect(mentalHealthRow.actions.items[0].href).toBe(
        '/test-submission-id/questions/mental-health?checkAnswers=true',
      )
    })

    it('calls next with error on failure', async () => {
      const error = new Error('Test error')
      ;(mockRes.locals!.getNamespace as jest.Mock).mockImplementation(() => {
        throw error
      })

      await renderCheckAnswers(mockReq as Request, mockRes as Response, mockNext)

      expect(mockNext).toHaveBeenCalledWith(error)
    })
  })

  describe('handleSubmission', () => {
    beforeEach(() => {
      mockRes.locals!.formData = {
        mentalHealth: MentalHealth.Well,
        assistance: [SupportAspect.MentalHealth],
        mentalHealthSupport: 'Need help',
        callback: CallbackRequested.Yes,
        callbackDetails: 'Call me',
        checkinStartedAt: Date.now(),
      }
      mockSubmitCheckin.mockResolvedValue({ id: 'checkin-123' })
    })

    it('calls submitCheckin with correct payload', async () => {
      await handleSubmission(mockReq as Request, mockRes as Response, mockNext)

      expect(mockSubmitCheckin).toHaveBeenCalledWith(
        'test-submission-id',
        expect.objectContaining({
          survey: expect.objectContaining({
            version: '2025-07-10@pilot',
            mentalHealth: 'WELL',
            assistance: ['MENTAL_HEALTH'],
            mentalHealthSupport: 'Need help',
            callback: 'YES',
            callbackDetails: 'Call me',
          }),
        }),
      )
    })

    it('converts string assistance to array', async () => {
      mockRes.locals!.formData!.assistance = SupportAspect.MentalHealth

      await handleSubmission(mockReq as Request, mockRes as Response, mockNext)

      expect(mockSubmitCheckin).toHaveBeenCalledWith(
        'test-submission-id',
        expect.objectContaining({
          survey: expect.objectContaining({
            assistance: ['MENTAL_HEALTH'],
          }),
        }),
      )
    })

    it('parses device data JSON', async () => {
      mockRes.locals!.formData!.deviceData = JSON.stringify({
        userAgent: 'Mozilla/5.0',
        platform: 'MacIntel',
      })

      await handleSubmission(mockReq as Request, mockRes as Response, mockNext)

      expect(mockSubmitCheckin).toHaveBeenCalledWith(
        'test-submission-id',
        expect.objectContaining({
          survey: expect.objectContaining({
            device: {
              userAgent: 'Mozilla/5.0',
              platform: 'MacIntel',
            },
          }),
        }),
      )
    })

    it('handles invalid device data JSON gracefully', async () => {
      mockRes.locals!.formData!.deviceData = 'invalid json'

      await handleSubmission(mockReq as Request, mockRes as Response, mockNext)

      expect(mockSubmitCheckin).toHaveBeenCalledWith(
        'test-submission-id',
        expect.objectContaining({
          survey: expect.objectContaining({
            device: undefined,
          }),
        }),
      )
    })

    it('redirects to confirmation on success', async () => {
      await handleSubmission(mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.redirect).toHaveBeenCalledWith('/test-submission-id/confirmation')
    })

    it('calls next with error on failure', async () => {
      const error = new Error('Submit failed')
      mockSubmitCheckin.mockRejectedValue(error)

      await handleSubmission(mockReq as Request, mockRes as Response, mockNext)

      expect(mockNext).toHaveBeenCalledWith(error)
    })

    it('includes all support fields in submission', async () => {
      mockRes.locals!.formData = {
        ...mockRes.locals!.formData,
        alcoholSupport: 'Alcohol details',
        drugsSupport: 'Drugs details',
        moneySupport: 'Money details',
        housingSupport: 'Housing details',
        supportSystemSupport: 'Support system details',
        otherSupport: 'Other details',
      }

      await handleSubmission(mockReq as Request, mockRes as Response, mockNext)

      expect(mockSubmitCheckin).toHaveBeenCalledWith(
        'test-submission-id',
        expect.objectContaining({
          survey: expect.objectContaining({
            alcoholSupport: 'Alcohol details',
            drugsSupport: 'Drugs details',
            moneySupport: 'Money details',
            housingSupport: 'Housing details',
            supportSystemSupport: 'Support system details',
            otherSupport: 'Other details',
          }),
        }),
      )
    })
  })
})
