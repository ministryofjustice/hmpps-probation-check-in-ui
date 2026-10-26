/* eslint-disable @typescript-eslint/no-explicit-any */
import handleFeedbackSubmission, { sanitiseFeedback } from './feedbackController'
import { services } from '../services'

jest.mock('../services')

jest.mock('../../logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
}))

describe('feedbackController', () => {
  describe('handleFeedbackSubmission', () => {
    const buildMockResponse = () => {
      const res: any = {}
      res.render = jest.fn()
      return res
    }

    const mockNext = jest.fn()
    const submitFeedback = jest.fn()

    beforeEach(() => {
      jest.clearAllMocks()
      ;(services as jest.Mock).mockReturnValue({
        esupervisionService: {
          submitFeedback,
        },
      })
    })

    it('does not save feedback when sanitised feedback is empty due to no values provided', async () => {
      const req: any = {
        body: {},
      }

      const res = buildMockResponse()

      await handleFeedbackSubmission(req, res, mockNext)

      expect(submitFeedback).not.toHaveBeenCalled()
      expect(res.render).toHaveBeenCalledWith('pages/feedback/thankyou')
    })

    it('does not save feedback when sanitised feedback is empty due to incorrect values', async () => {
      const req: any = {
        body: {
          howEasy: 'invalid',
          gettingSupport: 'nope',
          helpsFeelSupported: 'nope',
          lessContactNeeded: 'nope',
          improvements: ['bad'],
        },
      }

      const res = buildMockResponse()

      await handleFeedbackSubmission(req, res, mockNext)

      expect(submitFeedback).not.toHaveBeenCalled()
      expect(res.render).toHaveBeenCalledWith('pages/feedback/thankyou')
    })

    it('saves feedback when sanitised feedback contains valid values', async () => {
      const req: any = {
        body: {
          howEasy: 'easy',
          gettingSupport: 'yes',
          helpsFeelSupported: 'yes',
          lessContactNeeded: 'no',
          improvements: ['gettingHelp'],
        },
      }

      const res = buildMockResponse()

      await handleFeedbackSubmission(req, res, mockNext)

      expect(submitFeedback).toHaveBeenCalledTimes(1)
      expect(submitFeedback).toHaveBeenCalledWith(
        expect.objectContaining({
          feedback: {
            version: 1,
            howEasy: 'easy',
            helpsFeelSupported: 'yes',
            lessContactNeeded: 'no',
            improvements: ['gettingHelp'],
          },
        }),
      )
      expect(res.render).toHaveBeenCalledWith('pages/feedback/thankyou')
    })

    it('submits one answered question without the unanswered question or legacy field', async () => {
      const req: any = {
        body: {
          howEasy: 'easy',
          helpsFeelSupported: 'yes',
          gettingSupport: 'no',
        },
      }

      const res = buildMockResponse()

      await handleFeedbackSubmission(req, res, mockNext)

      expect(submitFeedback).toHaveBeenCalledWith(
        expect.objectContaining({
          feedback: {
            version: 1,
            howEasy: 'easy',
            helpsFeelSupported: 'yes',
          },
        }),
      )
    })

    it('submits neither optional question when both are unanswered', async () => {
      const req: any = {
        body: {
          howEasy: 'easy',
        },
      }

      const res = buildMockResponse()

      await handleFeedbackSubmission(req, res, mockNext)

      expect(submitFeedback).toHaveBeenCalledWith(
        expect.objectContaining({
          feedback: {
            version: 1,
            howEasy: 'easy',
          },
        }),
      )
    })

    it('passes error to next when submitFeedback throws', async () => {
      const error = new Error('DB down')
      submitFeedback.mockRejectedValueOnce(error)

      const req: any = {
        body: {
          howEasy: 'easy',
        },
      }

      const res = buildMockResponse()

      await handleFeedbackSubmission(req, res, mockNext)

      expect(mockNext).toHaveBeenCalledWith(error)
    })
  })

  describe('sanitiseFeedback', () => {
    it('returns an empty object when all inputs are invalid', () => {
      const result = sanitiseFeedback(123, false, false, { random: 'string' })
      expect(result).toEqual({})
    })

    it('accepts valid howEasy value', () => {
      const result = sanitiseFeedback('easy', null, null, null)
      expect(result).toEqual({ howEasy: 'easy' })
    })

    it('rejects invalid howEasy value', () => {
      const result = sanitiseFeedback('superEasy', null, null, null)
      expect(result).toEqual({})
    })

    it('accepts valid helpsFeelSupported value', () => {
      const result = sanitiseFeedback(null, 'yes', null, null)
      expect(result).toEqual({ helpsFeelSupported: 'yes' })
    })

    it('accepts valid lessContactNeeded value', () => {
      const result = sanitiseFeedback(null, null, 'no', null)
      expect(result).toEqual({ lessContactNeeded: 'no' })
    })

    it('filters invalid improvements from array', () => {
      const result = sanitiseFeedback(null, null, null, ['takingAVideo', 'nonsense', 123])

      expect(result).toEqual({
        improvements: ['takingAVideo'],
      })
    })

    it('returns empty object when improvements array contains no valid values', () => {
      const result = sanitiseFeedback(null, null, null, ['nope', 'stillNo'])
      expect(result).toEqual({})
    })

    it('wraps single valid improvement string into array', () => {
      const result = sanitiseFeedback(null, null, null, 'gettingHelp')
      expect(result).toEqual({
        improvements: ['gettingHelp'],
      })
    })

    it('combines multiple valid fields', () => {
      const result = sanitiseFeedback('veryEasy', 'no', 'yes', ['takingAVideo', 'gettingHelp'])

      expect(result).toEqual({
        howEasy: 'veryEasy',
        helpsFeelSupported: 'no',
        lessContactNeeded: 'yes',
        improvements: ['takingAVideo', 'gettingHelp'],
      })
    })
  })
})
