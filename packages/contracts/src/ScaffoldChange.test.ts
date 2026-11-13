import { describe, expect, it } from 'vitest'
import { ScaffoldChangeSchema } from './index'

describe('ScaffoldChangeSchema', () => {
  it('parses a change to no scaffold language', () => {
    expect(ScaffoldChangeSchema.parse({ scaffold: 'none' })).toEqual({ scaffold: 'none' })
  })

  it('rejects a scaffold language Townword does not offer', () => {
    expect(ScaffoldChangeSchema.safeParse({ scaffold: 'fr' }).success).toBe(false)
  })

  it('rejects a change that carries another field', () => {
    expect(ScaffoldChangeSchema.safeParse({ scaffold: 'es', email: 'a@b.co' }).success).toBe(false)
  })
})
