import { Request, Response, NextFunction } from 'express'
import validateStatus from './validateStatus'
import CheckinStatus from '../../data/models/checkinStatus'
import { EXPIRED_CONTENT } from '../../config/content'

describe('validateStatus middleware', () => {
  let req: Partial<Request>
  let res: Partial<Response>
  let next: NextFunction

  beforeEach(() => {
    req = {
      originalUrl: '/test-uuid/verify',
    }
    res = {
      locals: { user: { username: 'test-user', token: 'test-token', authSource: 'test' } },
      render: jest.fn(),
    }
    next = jest.fn()

    jest.clearAllMocks()
  })

  it('should call next when checkin status is CREATED', () => {
    res.locals.checkin = { status: CheckinStatus.Created }

    validateStatus(req as Request, res as Response, next)

    expect(next).toHaveBeenCalled()
    expect(res.render).not.toHaveBeenCalled()
  })

  it('should allow confirmation page when status is SUBMITTED', () => {
    req.originalUrl = '/test-uuid/confirmation'
    res.locals.checkin = { status: CheckinStatus.Submitted }

    validateStatus(req as Request, res as Response, next)

    expect(next).toHaveBeenCalled()
    expect(res.render).not.toHaveBeenCalled()
  })

  it('should render expired page when status is EXPIRED', () => {
    res.locals.checkin = { status: CheckinStatus.Expired }

    validateStatus(req as Request, res as Response, next)

    expect(res.render).toHaveBeenCalledWith('pages/expired', { content: EXPIRED_CONTENT })
    expect(next).not.toHaveBeenCalled()
  })

  it('should render not-found when status is SUBMITTED and not on confirmation page', () => {
    res.locals.checkin = { status: CheckinStatus.Submitted }

    validateStatus(req as Request, res as Response, next)

    expect(res.render).toHaveBeenCalledWith('pages/not-found')
    expect(next).not.toHaveBeenCalled()
  })

  it('should render not-found when checkin is missing', () => {
    res.locals.checkin = null

    validateStatus(req as Request, res as Response, next)

    expect(res.render).toHaveBeenCalledWith('pages/not-found')
    expect(next).not.toHaveBeenCalled()
  })

  it('should render not-found when status is invalid', () => {
    res.locals.checkin = { status: 'INVALID' }

    validateStatus(req as Request, res as Response, next)

    expect(res.render).toHaveBeenCalledWith('pages/not-found')
    expect(next).not.toHaveBeenCalled()
  })
})
