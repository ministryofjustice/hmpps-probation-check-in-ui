import type { HealthComponent } from '@ministryofjustice/hmpps-monitoring'
import { nonCritical } from './setUpHealthChecks'

jest.mock('../../logger', () => ({ warn: jest.fn(), info: jest.fn(), error: jest.fn() }))

const component = (health: HealthComponent['health']): HealthComponent => ({ isEnabled: () => true, health })

describe('nonCritical health component', () => {
  it('passes an UP result through unchanged', async () => {
    const result = await nonCritical(
      component(async () => ({ name: 'probationAccountApi', status: 'UP' })),
      'probationAccountApi',
    ).health()

    expect(result).toEqual({ name: 'probationAccountApi', status: 'UP' })
  })

  it('reports UP with the real status in details when the upstream is DOWN', async () => {
    const result = await nonCritical(
      component(async () => ({ name: 'probationAccountApi', status: 'DOWN', details: { status: 503, attempts: 3 } })),
      'probationAccountApi',
    ).health()

    expect(result.status).toBe('UP')
    expect(result.details).toEqual({ status: 503, attempts: 3, nonCritical: true, upstreamStatus: 'DOWN' })
  })

  it('reports UP when the upstream check throws', async () => {
    const result = await nonCritical(
      component(async () => {
        throw new Error('connection refused')
      }),
      'probationAccountApi',
    ).health()

    expect(result.status).toBe('UP')
    expect(result.details).toEqual({ nonCritical: true, upstreamStatus: 'DOWN', message: 'connection refused' })
  })

  it('keeps the wrapped component enabled state', () => {
    expect(nonCritical({ isEnabled: () => false, health: jest.fn() }, 'x').isEnabled()).toBe(false)
  })
})
