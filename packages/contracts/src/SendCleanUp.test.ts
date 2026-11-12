import { describe, expect, it } from 'vitest'
import { SendCleanUpSchema } from './index'

const cleanUp = { site: { area: 2, site: 4 }, team: { worker: 6, truck: 1 } }

describe('SendCleanUpSchema', () => {
  it('parses the site and the team', () => {
    expect(SendCleanUpSchema.parse(cleanUp)).toEqual(cleanUp)
  })

  it('rejects a clean-up given hours', () => {
    expect(SendCleanUpSchema.safeParse({ ...cleanUp, hours: 2 }).success).toBe(false)
  })

  it('rejects a site of area 0', () => {
    expect(SendCleanUpSchema.safeParse({ ...cleanUp, site: { area: 0, site: 4 } }).success).toBe(
      false,
    )
  })

  it('rejects a fractional count of hires', () => {
    expect(
      SendCleanUpSchema.safeParse({ ...cleanUp, team: { worker: 1.5, truck: 0 } }).success,
    ).toBe(false)
  })
})
