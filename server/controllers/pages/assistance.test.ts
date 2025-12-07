import { Request, Response } from 'express'
import { Session } from 'express-session'
import { renderAssistance, handleAssistance } from './assistance'
import { PAGES } from '../../config/pages.config'

describe('Assistance Controller', () => {
  let req: Partial<Request>
  let res: Partial<Response>

  beforeEach(() => {
    req = {
      params: { submissionId: 'test-uuid' },
      query: {},
      session: { id: 'test-session-id', formData: {} } as unknown as Session,
      body: {},
    }
    res = {
      render: jest.fn(),
      redirect: jest.fn(),
    }

    jest.clearAllMocks()
  })

  describe('renderAssistance', () => {
    it('should render assistance page with correct data', () => {
      renderAssistance(req as Request, res as Response, jest.fn())

      expect(res.render).toHaveBeenCalledWith('pages/assistance', {
        pageTitle: PAGES.assistance.title,
        hint: PAGES.assistance.hint,
        backLink: '/test-uuid/questions/mental-health',
        submissionId: 'test-uuid',
        cya: false,
      })
    })

    it('should use check answers backlink when in cya mode', () => {
      req.query = { checkAnswers: 'true' }

      renderAssistance(req as Request, res as Response, jest.fn())

      expect(res.render).toHaveBeenCalledWith('pages/assistance', {
        pageTitle: PAGES.assistance.title,
        hint: PAGES.assistance.hint,
        backLink: '/test-uuid/check-your-answers',
        submissionId: 'test-uuid',
        cya: true,
      })
    })
  })

  describe('handleAssistance', () => {
    it('should redirect to callback page', () => {
      req.body = { assistance: [] }

      handleAssistance(req as Request, res as Response, jest.fn())

      expect(res.redirect).toHaveBeenCalledWith('/test-uuid/questions/callback')
    })

    it('should redirect to check answers when in cya mode', () => {
      req.query = { checkAnswers: 'true' }
      req.body = { assistance: [] }

      handleAssistance(req as Request, res as Response, jest.fn())

      expect(res.redirect).toHaveBeenCalledWith('/test-uuid/check-your-answers')
    })
  })
})
