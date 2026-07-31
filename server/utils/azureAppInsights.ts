/*
 * Telemetry has to be initialised before any other application module is loaded, so that
 * OpenTelemetry can instrument express, http and bunyan as they are required. This module is
 * therefore imported first in server.ts, and deliberately imports nothing that would pull in
 * those modules early - notably config, which loads http via the rest client.
 */
import { flushTelemetry, initialiseTelemetry, telemetry } from '@ministryofjustice/hmpps-azure-telemetry'
import applicationName from '../applicationName'

initialiseTelemetry({
  serviceName: applicationName,
  serviceVersion: process.env.BUILD_NUMBER,
  connectionString: process.env.APPLICATIONINSIGHTS_CONNECTION_STRING,
  debug: process.env.DEBUG_TELEMETRY === 'true',
})
  .addFilter(telemetry.processors.filterSpanWherePath(['/health', '/info', '/ping', '/assets/*']))
  // Replaces the operation name override that used to be applied by an express middleware,
  // turning 'GET' into 'GET /:submissionId/check-in'
  .addModifier(telemetry.processors.enrichSpanNameWithHttpRoute())
  .startRecording()

process.on('SIGTERM', async () => {
  await flushTelemetry()
  process.exit(0)
})

export default function trackEvent(name: string, properties?: Record<string, string>): void {
  telemetry.trackEvent(name, properties)
}
