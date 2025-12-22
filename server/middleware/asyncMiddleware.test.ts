import { Request, Response, NextFunction, RequestHandler } from 'express'
import asyncMiddleware from './asyncMiddleware'

describe('asyncMiddleware', () => {
  let mockReq: Partial<Request>
  let mockRes: Partial<Response>
  let mockNext: jest.MockedFunction<NextFunction>

  beforeEach(() => {
    mockReq = {}
    mockRes = {}
    mockNext = jest.fn()
  })

  it('calls the wrapped handler', () => {
    const handler: RequestHandler = jest.fn()
    const wrapped = asyncMiddleware(handler)

    wrapped(mockReq as Request, mockRes as Response, mockNext)

    expect(handler).toHaveBeenCalledWith(mockReq, mockRes, mockNext)
  })

  it('passes through synchronous handlers', () => {
    const handler: RequestHandler = (req, res, next) => {
      next()
    }
    const wrapped = asyncMiddleware(handler)

    wrapped(mockReq as Request, mockRes as Response, mockNext)

    expect(mockNext).toHaveBeenCalled()
  })

  it('catches errors from async handlers and passes to next', async () => {
    const error = new Error('Async error')
    const handler: RequestHandler = async () => {
      throw error
    }
    const wrapped = asyncMiddleware(handler)

    wrapped(mockReq as Request, mockRes as Response, mockNext)

    await new Promise(process.nextTick)

    expect(mockNext).toHaveBeenCalledWith(error)
  })

  it('catches rejected promises and passes to next', async () => {
    const error = new Error('Rejected promise')
    const handler: RequestHandler = () => Promise.reject(error)
    const wrapped = asyncMiddleware(handler)

    wrapped(mockReq as Request, mockRes as Response, mockNext)

    await new Promise(process.nextTick)

    expect(mockNext).toHaveBeenCalledWith(error)
  })

  it('handles successful async handlers without calling next with error', async () => {
    const handler: RequestHandler = async (req, res, next) => {
      await Promise.resolve()
      next()
    }
    const wrapped = asyncMiddleware(handler)

    wrapped(mockReq as Request, mockRes as Response, mockNext)

    await new Promise(process.nextTick)

    expect(mockNext).toHaveBeenCalledWith()
  })

  it('does not call next twice when handler completes successfully', async () => {
    const handler: RequestHandler = async () => {
      await Promise.resolve()
    }
    const wrapped = asyncMiddleware(handler)

    wrapped(mockReq as Request, mockRes as Response, mockNext)

    await new Promise(process.nextTick)

    expect(mockNext).not.toHaveBeenCalled()
  })
})
