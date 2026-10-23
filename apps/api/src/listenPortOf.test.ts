import { describe, expect, it } from 'vitest'
import { listenPortOf } from './listenPortOf'

describe('listenPortOf', () => {
  it('answers the port API_PORT names', () => {
    expect(listenPortOf({ API_PORT: '3106' })).toBe(3106)
  })

  it('refuses to listen without API_PORT', () => {
    expect(() => listenPortOf({})).toThrow('API_PORT')
  })

  it('refuses a non-integer API_PORT', () => {
    expect(() => listenPortOf({ API_PORT: '31.5' })).toThrow('API_PORT')
  })

  it('refuses a non-positive API_PORT', () => {
    expect(() => listenPortOf({ API_PORT: '0' })).toThrow('API_PORT')
  })

  it('refuses an API_PORT above 65535', () => {
    expect(() => listenPortOf({ API_PORT: '65536' })).toThrow('API_PORT')
  })
})
