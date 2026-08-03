import { execFileSync } from 'node:child_process'

/*
 * Guards the OpenTelemetry pins in package.json.
 *
 * @ministryofjustice/hmpps-azure-telemetry declares its OpenTelemetry packages as exact peer
 * dependencies. Forcing them to newer versions - e.g. tidying the `@opentelemetry/core` override
 * into a matching lockstep set - silently stops custom events being emitted, because the logs API
 * global registry ends up split across duplicate copies of @opentelemetry/api-logs.
 *
 * Nothing else fails when that happens: typecheck, lint, build and npm audit all still pass, and
 * traces carry on working. Only custom events disappear. So run the real pipeline in debug mode
 * and assert an event actually reaches an exporter.
 */
describe('telemetry custom events', () => {
  it('delivers a custom event to an exporter', () => {
    // Mismatched pins can leave the flush hanging rather than just dropping the event, so the
    // child exits on a deadline either way and the assertion below reports what actually happened.
    const script = `
      const { initialiseTelemetry, flushTelemetry, telemetry } = require('@ministryofjustice/hmpps-azure-telemetry')
      initialiseTelemetry({ serviceName: 'regression-probe', debug: true }).startRecording()
      telemetry.trackEvent('RegressionProbe', { probe: 'true' })
      const deadline = setTimeout(() => process.exit(0), 15_000)
      Promise.resolve(flushTelemetry()).finally(() => {
        clearTimeout(deadline)
        process.exit(0)
      })
    `

    const output = execFileSync(process.execPath, ['-e', script], { encoding: 'utf-8', timeout: 30_000 })

    expect(output).toContain('RegressionProbe')
  })
})
