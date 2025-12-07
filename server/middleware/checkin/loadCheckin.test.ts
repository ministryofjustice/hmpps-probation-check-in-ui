import { Request, Response, NextFunction } from 'express'

import loadCheckin from './loadCheckin'

const mockGetCheckin = jest.fn()

jest.mock('../../services', () => ({
  services: jest.fn(() => ({
    esupervisionService: { getCheckin: (...args: unknown[]) => mockGetCheckin(...args) },
  })),
}))

describe('loadCheckin middleware', () => {
  let req: Partial<Request>
  let res: Partial<Response>
  let next: NextFunction

  const mockCheckinResponse = {
    checkin: {
      uuid: 'test-uuid',
      status: 'CREATED',
      offender: {},
    },
  }

  beforeEach(() => {
    req = {
      params: { submissionId: 'test-uuid' },
    }
    res = {
      locals: { user: { username: 'test-user', token: 'test-token', authSource: 'test' } },
      render: jest.fn(),
    }
    next = jest.fn()

    jest.clearAllMocks()
  })

  it('should load checkin and call next when submissionId exists', async () => {
    mockGetCheckin.mockResolvedValue(mockCheckinResponse)

    await loadCheckin(req as Request, res as Response, next)

    expect(mockGetCheckin).toHaveBeenCalledWith('test-uuid')
    expect(res.locals.checkin).toEqual(mockCheckinResponse.checkin)
    expect(next).toHaveBeenCalled()
    expect(res.render).not.toHaveBeenCalled()
  })

  it('should render not-found when submissionId is missing', async () => {
    req.params = {}

    await loadCheckin(req as Request, res as Response, next)

    expect(res.render).toHaveBeenCalledWith('pages/not-found')
    expect(next).not.toHaveBeenCalled()
  })

  it('should render not-found when service returns 404', async () => {
    const error = new Error('Not found') as Error & { responseStatus: number }
    error.responseStatus = 404
    mockGetCheckin.mockRejectedValue(error)

    await loadCheckin(req as Request, res as Response, next)

    expect(res.render).toHaveBeenCalledWith('pages/not-found')
    expect(next).not.toHaveBeenCalled()
  })

  it('should call next with error for non-404 errors', async () => {
    const error = new Error('Service error')
    mockGetCheckin.mockRejectedValue(error)

    await loadCheckin(req as Request, res as Response, next)

    expect(next).toHaveBeenCalledWith(error)
    expect(res.render).not.toHaveBeenCalled()
  })
})
