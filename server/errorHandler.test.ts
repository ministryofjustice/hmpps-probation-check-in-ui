import type { Express } from 'express'
import request from 'supertest'
import { appWithAllRoutes } from './routes/testutils/appSetup'

// Mock applicationInfo to avoid file system dependency
jest.mock('./applicationInfo', () => () => ({
  applicationName: 'test-app',
  buildNumber: '1',
  gitRef: 'test-ref',
  gitShortHash: 'test-re',
  productId: 'test-product',
  branchName: 'test-branch',
}))

let app: Express

beforeEach(() => {
  app = appWithAllRoutes({})
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET 404', () => {
  it('should render content with stack in dev mode', () => {
    return request(app)
      .get('/unknown')
      .expect(404)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('NotFoundError: Not Found')
        expect(res.text).not.toContain('Something went wrong. The error has been logged. Please try again')
      })
  })

  it('should render content without stack in production mode', () => {
    return request(appWithAllRoutes({ production: true }))
      .get('/unknown')
      .expect(404)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Sorry, there is a problem with the service')
        expect(res.text).toContain('Try again later')
        expect(res.text).toContain('Your reference number is')
        expect(res.text).not.toContain('NotFoundError: Not Found')
      })
  })
})
