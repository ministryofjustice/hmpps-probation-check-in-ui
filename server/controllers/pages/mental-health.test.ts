import { Request, Response } from 'express'
import { renderMentalHealth, handleMentalHealth } from './mental-health'
import { PAGES } from '../../config/pages.config'

describe('Mental Health Controller', () => {
  let req: Partial<Request>
  let res: Partial<Response>

  beforeEach(() => {
    req = {
      params: { submissionId: 'test-uuid' },
      query: {},
    }
    res = {
      render: jest.fn(),
      redirect: jest.fn(),
    }

    jest.clearAllMocks()
  })

  describe('renderMentalHealth', () => {
    it('should render mental health page with correct data', () => {
      renderMentalHealth(req as Request, res as Response, jest.fn())

      expect(res.render).toHaveBeenCalledWith('pages/mental-health', {
        pageTitle: PAGES.mentalHealth.title,
        hint: PAGES.mentalHealth.hint,
        insetText: PAGES.mentalHealth.insetText,
        backLink: '/test-uuid/verify',
        submissionId: 'test-uuid',
        cya: false,
      })
    })

    it('should set cya flag and backLink when in check answers mode', () => {
      req.query = { checkAnswers: 'true' }

      renderMentalHealth(req as Request, res as Response, jest.fn())

      expect(res.render).toHaveBeenCalledWith('pages/mental-health', {
        pageTitle: PAGES.mentalHealth.title,
        hint: PAGES.mentalHealth.hint,
        insetText: PAGES.mentalHealth.insetText,
        backLink: '/test-uuid/check-your-answers',
        submissionId: 'test-uuid',
        cya: true,
      })
    })
  })

  describe('handleMentalHealth', () => {
    it('should redirect to assistance page', () => {
      handleMentalHealth(req as Request, res as Response, jest.fn())

      expect(res.redirect).toHaveBeenCalledWith('/test-uuid/questions/assistance')
    })

    it('should redirect to check answers when in cya mode', () => {
      req.query = { checkAnswers: 'true' }

      handleMentalHealth(req as Request, res as Response, jest.fn())

      expect(res.redirect).toHaveBeenCalledWith('/test-uuid/check-your-answers')
    })
  })
})
