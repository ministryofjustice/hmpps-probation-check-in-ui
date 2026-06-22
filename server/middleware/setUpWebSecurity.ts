import crypto from 'crypto'
import express, { Router, Request, Response, NextFunction } from 'express'
import helmet from 'helmet'

export default function setUpWebSecurity(): Router {
  const router = express.Router()

  // Secure code best practice - see:
  // 1. https://expressjs.com/en/advanced/best-practice-security.html,
  // 2. https://www.npmjs.com/package/helmet
  router.use((_req: Request, res: Response, next: NextFunction) => {
    res.locals.cspNonce = crypto.randomBytes(16).toString('hex')
    next()
  })
  router.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          // This nonce allows us to use scripts with the use of the `cspNonce` local, e.g (in a Nunjucks template):
          // <script nonce="{{ cspNonce }}">
          // or
          // <link href="http://example.com/" rel="stylesheet" nonce="{{ cspNonce }}">
          // This ensures only scripts we trust are loaded, and not anything injected into the
          // page by an attacker.
          // 'wasm-unsafe-eval' + blob: are required to compile/run the on-device MediaPipe
          // face detector (WASM) used by the fallback verify gate; assets are self-hosted.
          scriptSrc: [
            "'self'",
            "'wasm-unsafe-eval'",
            'blob:',
            (_req: Request, res: Response) => `'nonce-${res.locals.cspNonce}'`,
          ],
          styleSrc: ["'self'", (_req: Request, res: Response) => `'nonce-${res.locals.cspNonce}'`],
          mediaSrc: "'self' data: blob localhost",
          fontSrc: ["'self'"],
          formAction: ["'self'"],
          // MediaPipe spins up its WASM runtime in a worker created from a blob URL.
          workerSrc: ["'self'", 'blob:'],
        },
      },
      crossOriginEmbedderPolicy: true,
    }),
  )
  return router
}
