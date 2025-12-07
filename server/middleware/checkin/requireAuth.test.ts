import { Request, Response, NextFunction } from 'express'
import { Session } from 'express-session'
import requireAuth from './requireAuth'

describe('requireAuth middleware', () => {
  let req: Partial<Request>
  let res: Partial<Response>
  let next: NextFunction

  beforeEach(() => {
    req = {
      params: { submissionId: 'test-uuid' },
      session: { id: 'test-session-id' } as unknown as Session,
    }
    res = {
      locals: { user: { username: 'test-user', token: 'test-token', authSource: 'test' } },
      render: jest.fn(),
    }
    next = jest.fn()

    jest.clearAllMocks()
  })

  it('should call next when submissionAuthorized is true', () => {
    req.session.submissionAuthorized = 'test-uuid'

    requireAuth(req as Request, res as Response, next)

    expect(next).toHaveBeenCalled()
    expect(res.locals.submissionAuthorized).toBe('test-uuid')
    expect(res.render).not.toHaveBeenCalled()
  })

  it('should render timeout page when not authorized', () => {
    req.session.submissionAuthorized = undefined

    requireAuth(req as Request, res as Response, next)

    expect(res.render).toHaveBeenCalledWith('pages/timeout', { submissionId: 'test-uuid' })
    expect(next).not.toHaveBeenCalled()
  })

  it('should render timeout page when submissionAuthorized is undefined', () => {
    req.session.submissionAuthorized = undefined

    requireAuth(req as Request, res as Response, next)

    expect(res.render).toHaveBeenCalledWith('pages/timeout', { submissionId: 'test-uuid' })
    expect(next).not.toHaveBeenCalled()
  })
})
