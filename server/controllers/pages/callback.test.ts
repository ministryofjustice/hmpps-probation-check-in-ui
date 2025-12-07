import { Request, Response } from 'express'
import { renderCallback, handleCallback } from './callback'
import { PAGES } from '../../config/pages.config'

describe('Callback Controller', () => {
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

  describe('renderCallback', () => {
    it('should render callback page with correct data', () => {
      renderCallback(req as Request, res as Response, jest.fn())

      expect(res.render).toHaveBeenCalledWith('pages/callback', {
        pageTitle: PAGES.callback.title,
        backLink: '/test-uuid/questions/assistance',
        submissionId: 'test-uuid',
        cya: false,
      })
    })

    it('should use check answers backlink when in cya mode', () => {
      req.query = { checkAnswers: 'true' }

      renderCallback(req as Request, res as Response, jest.fn())

      expect(res.render).toHaveBeenCalledWith('pages/callback', {
        pageTitle: PAGES.callback.title,
        backLink: '/test-uuid/check-your-answers',
        submissionId: 'test-uuid',
        cya: true,
      })
    })
  })

  describe('handleCallback', () => {
    it('should redirect to video inform page', () => {
      handleCallback(req as Request, res as Response, jest.fn())

      expect(res.redirect).toHaveBeenCalledWith('/test-uuid/video/inform')
    })

    it('should redirect to check answers when in cya mode', () => {
      req.query = { checkAnswers: 'true' }

      handleCallback(req as Request, res as Response, jest.fn())

      expect(res.redirect).toHaveBeenCalledWith('/test-uuid/check-your-answers')
    })
  })
})
