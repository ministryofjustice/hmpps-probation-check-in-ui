import { type RequestHandler, Router } from 'express'
import asyncMiddleware from '../middleware/asyncMiddleware'

const routes = (): Router => {
  const router = Router()
  const get = (path: string | string[], handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  get('/', (req, res) => {
    res.render('pages/index')
  })

  get('/privacy-notice', (req, res) => {
    res.render('pages/privacy')
  })

  get('/accessibility', (req, res) => {
    res.render('pages/accessibility')
  })

  get('/.well-known/appspecific/com.chrome.devtools.json', async (req, res) => {
    return res.status(404).render('pages/error')
  })

  return router
}

export default routes
