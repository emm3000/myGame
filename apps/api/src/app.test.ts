import { HealthResponseSchema } from '@mygame/contracts'
import { describe, expect, it } from 'vitest'
import { app } from './app'

describe('app', () => {
  it('answers the health route with a body the contract parses', async () => {
    const response = await app.request('/health')

    expect(response.status).toBe(200)
    expect(HealthResponseSchema.safeParse(await response.json()).success).toBe(true)
  })
})
