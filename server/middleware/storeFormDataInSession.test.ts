/* eslint-disable @typescript-eslint/no-explicit-any */
import storeFormDataInSession from './storeFormDataInSession'

const buildReq = (overrides: Partial<{ body: any; contentType: string | false; session: any }> = {}) => {
  const { body, contentType = 'application/x-www-form-urlencoded', session = {} } = overrides
  return {
    body,
    session,
    is: jest.fn((type: string) => (contentType && contentType === type ? contentType : false)),
  } as any
}

const buildRes = () => ({ locals: {} }) as any

describe('storeFormDataInSession', () => {
  const middleware = storeFormDataInSession()

  it('initialises session.formData and res.locals.formData when no body is present', async () => {
    const req = buildReq({ body: undefined })
    const res = buildRes()
    const next = jest.fn()

    await middleware(req, res, next)

    expect(req.session.formData).toEqual({})
    expect(res.locals.formData).toEqual({})
    expect(next).toHaveBeenCalledTimes(1)
  })

  describe('url-encoded form posts', () => {
    it('writes form fields onto session.formData', async () => {
      const req = buildReq({ body: { circumstances: 'home', policeContact: 'no' } })
      const res = buildRes()

      await middleware(req, res, jest.fn())

      expect(req.session.formData).toEqual({ circumstances: 'home', policeContact: 'no' })
      expect(res.locals.formData).toEqual({ circumstances: 'home', policeContact: 'no' })
    })

    it('skips underscore-prefixed keys (e.g. _csrf, _method)', async () => {
      const req = buildReq({ body: { _csrf: 'token', alcoholUse: 'no' } })
      const res = buildRes()

      await middleware(req, res, jest.fn())

      expect(req.session.formData).toEqual({ alcoholUse: 'no' })
      expect(req.session.formData).not.toHaveProperty('_csrf')
    })

    it('deletes a key when the value is the unchecked sentinel', async () => {
      const req = buildReq({
        body: { policeContact: '_unchecked' },
        session: { formData: { policeContact: 'yes', alcoholUse: 'no' } },
      })
      const res = buildRes()

      await middleware(req, res, jest.fn())

      expect(req.session.formData).not.toHaveProperty('policeContact')
      expect(req.session.formData.alcoholUse).toBe('no')
    })

    it('strips the unchecked sentinel from checkbox arrays', async () => {
      const req = buildReq({ body: { circumstances: ['_unchecked', 'home', 'work'] } })
      const res = buildRes()

      await middleware(req, res, jest.fn())

      expect(req.session.formData.circumstances).toEqual(['home', 'work'])
    })

    it('preserves existing session.formData entries not present in the body', async () => {
      const req = buildReq({
        body: { circumstances: 'home' },
        session: { formData: { policeContact: 'no' } },
      })
      const res = buildRes()

      await middleware(req, res, jest.fn())

      expect(req.session.formData).toEqual({ policeContact: 'no', circumstances: 'home' })
    })
  })

  describe('non-form requests', () => {
    it('does not write JSON post bodies into session.formData', async () => {
      const req = buildReq({
        body: { state: 'MULTIPLE_FACES_ERROR' },
        contentType: false,
      })
      const res = buildRes()

      await middleware(req, res, jest.fn())

      expect(req.session.formData).toEqual({})
      expect(req.session.formData).not.toHaveProperty('state')
    })

    it('leaves an existing session.formData untouched on a JSON post', async () => {
      const req = buildReq({
        body: { state: 'MULTIPLE_FACES_ERROR' },
        contentType: false,
        session: { formData: { circumstances: 'home', livenessFallbackAllowed: true } },
      })
      const res = buildRes()

      await middleware(req, res, jest.fn())

      expect(req.session.formData).toEqual({ circumstances: 'home', livenessFallbackAllowed: true })
    })
  })

  it('mirrors session.formData onto res.locals.formData after merging', async () => {
    const req = buildReq({
      body: { alcoholUse: 'yes' },
      session: { formData: { circumstances: 'home' } },
    })
    const res = buildRes()

    await middleware(req, res, jest.fn())

    expect(res.locals.formData).toEqual({ circumstances: 'home', alcoholUse: 'yes' })
  })
})
