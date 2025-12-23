import { Request, Response, NextFunction } from 'express'
import {
  renderMentalHealth,
  handleMentalHealth,
  renderAssistance,
  handleAssistance,
  renderCallback,
  handleCallback,
} from './questionsController'

describe('questionsController', () => {
  let mockReq: Partial<Request>
  let mockRes: Partial<Response>
  let mockNext: jest.MockedFunction<NextFunction>

  beforeEach(() => {
    mockReq = {
      params: { submissionId: 'test-submission-id' },
      query: {},
      body: {},
      session: {
        formData: {},
      } as Request['session'],
    }
    mockRes = {
      render: jest.fn(),
      redirect: jest.fn(),
      locals: {
        getNamespace: jest.fn(() => ({
          mentalHealth: {
            pageTitle: 'Mental Health Question',
            options: {
              VERY_WELL: 'Very well',
              WELL: 'Well',
              NOT_GREAT: 'Not great',
              STRUGGLING: 'Struggling',
            },
          },
          assistance: {
            pageTitle: 'Assistance Question',
            options: {
              MENTAL_HEALTH: 'Mental health',
              ALCOHOL: 'Alcohol',
              DRUGS: 'Drugs',
              NO_HELP: 'No help needed',
            },
            conditionalLabels: {
              mentalHealthSupport: 'Tell us more about mental health',
              alcoholSupport: 'Tell us more about alcohol',
              drugsSupport: 'Tell us more about drugs',
            },
            divider: 'or',
          },
          callback: {
            pageTitle: 'Callback Question',
            options: {
              YES: 'Yes',
              NO: 'No',
            },
            conditionalLabel: 'What would you like to discuss?',
          },
        })),
      } as unknown as Response['locals'],
    }
    mockNext = jest.fn()
  })

  describe('renderMentalHealth', () => {
    it('renders mental health page', async () => {
      await renderMentalHealth(mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.render).toHaveBeenCalledWith('pages/submission/questions/mental-health', expect.any(Object))
    })

    it('includes page title from content', async () => {
      await renderMentalHealth(mockReq as Request, mockRes as Response, mockNext)

      const renderCall = (mockRes.render as jest.Mock).mock.calls[0]
      expect(renderCall[1].pageTitle).toBe('Mental Health Question')
    })

    it('includes mental health options', async () => {
      await renderMentalHealth(mockReq as Request, mockRes as Response, mockNext)

      const renderCall = (mockRes.render as jest.Mock).mock.calls[0]
      expect(renderCall[1].mentalHealthOptions).toEqual([
        { value: 'VERY_WELL', text: 'Very well' },
        { value: 'WELL', text: 'Well' },
        { value: 'NOT_GREAT', text: 'Not great' },
        { value: 'STRUGGLING', text: 'Struggling' },
      ])
    })

    it('includes submissionId', async () => {
      await renderMentalHealth(mockReq as Request, mockRes as Response, mockNext)

      const renderCall = (mockRes.render as jest.Mock).mock.calls[0]
      expect(renderCall[1].submissionId).toBe('test-submission-id')
    })

    it('includes back link to verify page', async () => {
      await renderMentalHealth(mockReq as Request, mockRes as Response, mockNext)

      const renderCall = (mockRes.render as jest.Mock).mock.calls[0]
      expect(renderCall[1].backLink).toBe('/test-submission-id/verify')
    })

    it('includes back link to check answers when cya=true', async () => {
      mockReq.query = { checkAnswers: 'true' }

      await renderMentalHealth(mockReq as Request, mockRes as Response, mockNext)

      const renderCall = (mockRes.render as jest.Mock).mock.calls[0]
      expect(renderCall[1].backLink).toBe('/test-submission-id/check-your-answers')
    })

    it('calls next with error on failure', async () => {
      const error = new Error('Test error')
      ;(mockRes.locals!.getNamespace as jest.Mock).mockImplementation(() => {
        throw error
      })

      await renderMentalHealth(mockReq as Request, mockRes as Response, mockNext)

      expect(mockNext).toHaveBeenCalledWith(error)
    })
  })

  describe('handleMentalHealth', () => {
    it('redirects to assistance page', async () => {
      await handleMentalHealth(mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.redirect).toHaveBeenCalledWith('/test-submission-id/questions/assistance')
    })

    it('redirects to check answers when cya=true', async () => {
      mockReq.query = { checkAnswers: 'true' }

      await handleMentalHealth(mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.redirect).toHaveBeenCalledWith('/test-submission-id/check-your-answers')
    })
  })

  describe('renderAssistance', () => {
    it('renders assistance page', async () => {
      await renderAssistance(mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.render).toHaveBeenCalledWith('pages/submission/questions/assistance', expect.any(Object))
    })

    it('includes page title from content', async () => {
      await renderAssistance(mockReq as Request, mockRes as Response, mockNext)

      const renderCall = (mockRes.render as jest.Mock).mock.calls[0]
      expect(renderCall[1].pageTitle).toBe('Assistance Question')
    })

    it('builds assistance options with conditional fields', async () => {
      await renderAssistance(mockReq as Request, mockRes as Response, mockNext)

      const renderCall = (mockRes.render as jest.Mock).mock.calls[0]
      const mentalHealthOption = renderCall[1].assistanceOptions.find(
        (opt: Record<string, unknown>) => opt.value === 'MENTAL_HEALTH',
      )

      expect(mentalHealthOption.conditional).toEqual({
        fieldName: 'mentalHealthSupport',
        label: 'Tell us more about mental health',
      })
    })

    it('adds exclusive behavior to NO_HELP option', async () => {
      await renderAssistance(mockReq as Request, mockRes as Response, mockNext)

      const renderCall = (mockRes.render as jest.Mock).mock.calls[0]
      const noHelpOption = renderCall[1].assistanceOptions.find(
        (opt: Record<string, unknown>) => opt.value === 'NO_HELP',
      )

      expect(noHelpOption.behaviour).toBe('exclusive')
    })

    it('inserts divider before NO_HELP option', async () => {
      await renderAssistance(mockReq as Request, mockRes as Response, mockNext)

      const renderCall = (mockRes.render as jest.Mock).mock.calls[0]
      const noHelpIndex = renderCall[1].assistanceOptions.findIndex(
        (opt: Record<string, unknown>) => opt.value === 'NO_HELP',
      )
      const dividerIndex = renderCall[1].assistanceOptions.findIndex(
        (opt: Record<string, unknown>) => opt.divider === 'or',
      )

      expect(dividerIndex).toBe(noHelpIndex - 1)
    })

    it('includes back link to mental health page', async () => {
      await renderAssistance(mockReq as Request, mockRes as Response, mockNext)

      const renderCall = (mockRes.render as jest.Mock).mock.calls[0]
      expect(renderCall[1].backLink).toBe('/test-submission-id/questions/mental-health')
    })
  })

  describe('handleAssistance', () => {
    it('redirects to callback page', async () => {
      mockReq.body = { assistance: ['MENTAL_HEALTH'] }

      await handleAssistance(mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.redirect).toHaveBeenCalledWith('/test-submission-id/questions/callback')
    })

    it('clears support fields when parent checkbox is unchecked', async () => {
      mockReq.session = {
        formData: {
          mentalHealthSupport: 'Some support text',
          alcoholSupport: 'Alcohol text',
        },
      } as Request['session']
      mockReq.body = { assistance: ['DRUGS'] }

      await handleAssistance(mockReq as Request, mockRes as Response, mockNext)

      expect(mockReq.session!.formData!.mentalHealthSupport).toBe('')
      expect(mockReq.session!.formData!.alcoholSupport).toBe('')
    })

    it('preserves support fields when parent checkbox is checked', async () => {
      mockReq.session = {
        formData: {
          mentalHealthSupport: 'Some support text',
        },
      } as Request['session']
      mockReq.body = { assistance: ['MENTAL_HEALTH', 'DRUGS'] }

      await handleAssistance(mockReq as Request, mockRes as Response, mockNext)

      expect(mockReq.session!.formData!.mentalHealthSupport).toBe('Some support text')
    })

    it('handles string assistance value', async () => {
      mockReq.body = { assistance: 'MENTAL_HEALTH' }

      await handleAssistance(mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.redirect).toHaveBeenCalledWith('/test-submission-id/questions/callback')
    })

    it('redirects to check answers when cya=true', async () => {
      mockReq.query = { checkAnswers: 'true' }
      mockReq.body = { assistance: ['MENTAL_HEALTH'] }

      await handleAssistance(mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.redirect).toHaveBeenCalledWith('/test-submission-id/check-your-answers')
    })
  })

  describe('renderCallback', () => {
    it('renders callback page', async () => {
      await renderCallback(mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.render).toHaveBeenCalledWith('pages/submission/questions/callback', expect.any(Object))
    })

    it('includes callback options', async () => {
      await renderCallback(mockReq as Request, mockRes as Response, mockNext)

      const renderCall = (mockRes.render as jest.Mock).mock.calls[0]
      expect(renderCall[1].callbackOptions).toEqual([
        { value: 'YES', text: 'Yes' },
        { value: 'NO', text: 'No' },
      ])
    })

    it('includes conditional label', async () => {
      await renderCallback(mockReq as Request, mockRes as Response, mockNext)

      const renderCall = (mockRes.render as jest.Mock).mock.calls[0]
      expect(renderCall[1].conditionalLabel).toBe('What would you like to discuss?')
    })

    it('includes back link to assistance page', async () => {
      await renderCallback(mockReq as Request, mockRes as Response, mockNext)

      const renderCall = (mockRes.render as jest.Mock).mock.calls[0]
      expect(renderCall[1].backLink).toBe('/test-submission-id/questions/assistance')
    })
  })

  describe('handleCallback', () => {
    it('redirects to video inform page', async () => {
      await handleCallback(mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.redirect).toHaveBeenCalledWith('/test-submission-id/video/inform')
    })

    it('redirects to check answers when cya=true', async () => {
      mockReq.query = { checkAnswers: 'true' }

      await handleCallback(mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.redirect).toHaveBeenCalledWith('/test-submission-id/check-your-answers')
    })
  })
})
