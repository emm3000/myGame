import { describe, expect, it } from 'vitest'
import { composeServer } from './composeServer'

describe('composeServer', () => {
  it('listens on the port API_PORT names', () => {
    const server = composeServer({ API_PORT: '3106' })

    expect(server.port).toBe(3106)
  })

  it('refuses to compose without API_PORT', () => {
    expect(() => composeServer({})).toThrow('API_PORT')
  })

  it('refuses to compose with a non-integer API_PORT', () => {
    expect(() => composeServer({ API_PORT: '31.5' })).toThrow('API_PORT')
  })

  it('refuses to compose with a non-positive API_PORT', () => {
    expect(() => composeServer({ API_PORT: '0' })).toThrow('API_PORT')
  })

  it('refuses to compose with an API_PORT above 65535', () => {
    expect(() => composeServer({ API_PORT: '65536' })).toThrow('API_PORT')
  })
})
