import { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import validateFormData, { findError, createSchema, validationErrors } from './validateFormData'

describe('validateFormData middleware', () => {
  let mockReq: Partial<Request>
  let mockRes: Partial<Response>
  let mockNext: jest.MockedFunction<NextFunction>

  beforeEach(() => {
    mockReq = {
      body: {},
      originalUrl: '/test-url',
      flash: jest.fn(),
    }
    mockRes = {
      redirect: jest.fn(),
    }
    mockNext = jest.fn()
  })

  describe('successful validation', () => {
    it('calls next() when validation passes', () => {
      const schema = z.object({ name: z.string() })
      mockReq.body = { name: 'John' }

      validateFormData(schema)(mockReq as Request, mockRes as Response, mockNext)

      expect(mockNext).toHaveBeenCalled()
      expect(mockRes.redirect).not.toHaveBeenCalled()
    })

    it('updates req.body with parsed data', () => {
      const schema = z.object({ age: z.coerce.number() })
      mockReq.body = { age: '25' }

      validateFormData(schema)(mockReq as Request, mockRes as Response, mockNext)

      expect(mockReq.body).toEqual({ age: 25 })
    })

    it('removes unknown fields when using strict schema', () => {
      const schema = z.object({ name: z.string() }).strict()
      mockReq.body = { name: 'John' }

      validateFormData(schema)(mockReq as Request, mockRes as Response, mockNext)

      expect(mockNext).toHaveBeenCalled()
    })
  })

  describe('failed validation', () => {
    it('redirects back to original URL on validation failure', () => {
      const schema = z.object({ name: z.string().min(1, 'Name is required') })
      mockReq.body = { name: '' }

      validateFormData(schema)(mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.redirect).toHaveBeenCalledWith('/test-url')
      expect(mockNext).not.toHaveBeenCalled()
    })

    it('stores validation errors in flash', () => {
      const schema = z.object({ name: z.string().min(1, 'Name is required') })
      mockReq.body = { name: '' }

      validateFormData(schema)(mockReq as Request, mockRes as Response, mockNext)

      expect(mockReq.flash).toHaveBeenCalledWith('validationErrors', expect.any(String))
    })

    it('formats error messages with href for field', () => {
      const schema = z.object({ email: z.string().email('Invalid email') })
      mockReq.body = { email: 'not-an-email' }

      validateFormData(schema)(mockReq as Request, mockRes as Response, mockNext)

      const flashCall = (mockReq.flash as jest.Mock).mock.calls.find(call => call[0] === 'validationErrors')
      const errors = JSON.parse(flashCall[1])
      expect(errors).toContainEqual({
        text: 'Invalid email',
        href: '#email',
      })
    })

    it('stores form body in flash for restoration', () => {
      const schema = z.object({ name: z.string().min(1, 'Name is required') })
      mockReq.body = { name: '', email: 'test@example.com' }

      validateFormData(schema)(mockReq as Request, mockRes as Response, mockNext)

      expect(mockReq.flash).toHaveBeenCalledWith('formBody', JSON.stringify({ name: '', email: 'test@example.com' }))
    })

    it('handles nested field paths', () => {
      const schema = z.object({
        user: z.object({
          name: z.string().min(1, 'Name required'),
        }),
      })
      mockReq.body = { user: { name: '' } }

      validateFormData(schema)(mockReq as Request, mockRes as Response, mockNext)

      const flashCall = (mockReq.flash as jest.Mock).mock.calls.find(call => call[0] === 'validationErrors')
      const errors = JSON.parse(flashCall[1])
      expect(errors).toContainEqual({
        text: 'Name required',
        href: '#user.name',
      })
    })
  })
})

describe('findError', () => {
  it('returns matching error for field name', () => {
    const errors: validationErrors = [
      { text: 'Name is required', href: '#name' },
      { text: 'Email is invalid', href: '#email' },
    ]

    const result = findError(errors, 'name')

    expect(result).toEqual({ text: 'Name is required', href: '#name' })
  })

  it('returns null when no matching error', () => {
    const errors: validationErrors = [{ text: 'Name is required', href: '#name' }]

    const result = findError(errors, 'email')

    expect(result).toBeNull()
  })

  it('returns null for undefined errors', () => {
    const result = findError(undefined, 'name')
    expect(result).toBeNull()
  })

  it('returns null for null errors', () => {
    const result = findError(null, 'name')
    expect(result).toBeNull()
  })

  it('returns null for non-array errors', () => {
    // @ts-expect-error - Testing runtime handling of invalid input type
    const result = findError('not-an-array', 'name')
    expect(result).toBeNull()
  })

  it('returns null for empty array', () => {
    const result = findError([], 'name')
    expect(result).toBeNull()
  })
})

describe('createSchema', () => {
  it('creates a schema that accepts _csrf field', () => {
    const schema = createSchema({ name: z.string() })
    const result = schema.safeParse({ name: 'John', _csrf: 'token123' })

    expect(result.success).toBe(true)
  })

  it('creates a strict schema that rejects unknown fields', () => {
    const schema = createSchema({ name: z.string() })
    const result = schema.safeParse({ name: 'John', unknown: 'field' })

    expect(result.success).toBe(false)
  })

  it('validates required fields', () => {
    const schema = createSchema({ name: z.string().min(1) })
    const result = schema.safeParse({ name: '' })

    expect(result.success).toBe(false)
  })

  it('returns parsed data on success', () => {
    const schema = createSchema({ age: z.coerce.number() })
    const result = schema.safeParse({ age: '25' })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.age).toBe(25)
    }
  })
})
