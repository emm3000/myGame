import { describe, expect, it } from 'vitest'
import { SendJobSchema } from './index'

const job = { site: { area: 2, site: 5 }, team: { worker: 3, truck: 0 }, hours: 2 }

describe('SendJobSchema', () => {
  it('parses the site, the team and the hours', () => {
    expect(SendJobSchema.parse(job)).toEqual(job)
  })

  it('rejects a job of no hours', () => {
    expect(SendJobSchema.safeParse({ ...job, hours: 0 }).success).toBe(false)
  })

  it('rejects a fractional count of hires', () => {
    expect(SendJobSchema.safeParse({ ...job, team: { worker: 1.5, truck: 0 } }).success).toBe(false)
  })

  it('rejects a team that names a hire the office does not offer', () => {
    expect(SendJobSchema.safeParse({ ...job, team: { worker: 1, truck: 0, van: 1 } }).success).toBe(
      false,
    )
  })

  it('rejects a site of area 0', () => {
    expect(SendJobSchema.safeParse({ ...job, site: { area: 0, site: 5 } }).success).toBe(false)
  })
})
