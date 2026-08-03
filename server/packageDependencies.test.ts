import fs from 'fs'

describe('telemetry compatibility', () => {
  it('uses bunyan v1', () => {
    // @opentelemetry/instrumentation-bunyan only instruments bunyan '>=1.0.0 <2', so logs would
    // stop being collected and correlated with traces if bunyan were upgraded to v2.
    const packageData = JSON.parse(fs.readFileSync('./package.json', 'utf-8'))
    // eslint-disable-next-line no-useless-escape
    expect(packageData.dependencies.bunyan).toMatch(/[^\.]1\..*/)
  })
})
