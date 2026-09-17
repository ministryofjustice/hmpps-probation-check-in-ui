import express, { Router } from 'express'

import {
  monitoringMiddleware,
  endpointHealthComponent,
  type HealthComponent,
} from '@ministryofjustice/hmpps-monitoring'
import type { ApplicationInfo } from '../applicationInfo'
import logger from '../../logger'
import config from '../config'

/**
 * APIs that are not needed for the core check-in journey. They still appear in the /health
 * report so problems are visible, but a failure does not mark the whole service as DOWN
 * (which would otherwise fail the pod's health probes).
 */
const nonCriticalApis: (keyof typeof config.apis)[] = ['probationAccountApi']

export const nonCritical = (component: HealthComponent, name: string): HealthComponent => ({
  isEnabled: () => component.isEnabled(),
  health: async () => {
    try {
      const result = await component.health()
      if (result.status === 'UP') {
        return result
      }
      return { ...result, status: 'UP', details: { ...result.details, nonCritical: true, upstreamStatus: 'DOWN' } }
    } catch (error) {
      logger.warn(`Non-critical health check for ${name} threw: ${error.message}`)
      return { name, status: 'UP', details: { nonCritical: true, upstreamStatus: 'DOWN', message: error.message } }
    }
  },
})

export default function setUpHealthChecks(applicationInfo: ApplicationInfo): Router {
  const router = express.Router()

  const apiConfig = Object.entries(config.apis)

  const middleware = monitoringMiddleware({
    applicationInfo,
    healthComponents: apiConfig.map(([name, options]) => {
      const component = endpointHealthComponent(logger, name, options)
      return nonCriticalApis.includes(name as keyof typeof config.apis) ? nonCritical(component, name) : component
    }),
  })

  router.get('/health', middleware.health)
  router.get('/info', middleware.info)
  router.get('/ping', middleware.ping)

  return router
}
