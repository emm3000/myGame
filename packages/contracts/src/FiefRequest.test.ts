import { describe, expect, it } from 'vitest'
import { FiefRequestSchema } from './index'

describe('FiefRequestSchema', () => {
  it('parses the fief id the path names', () => {
    const fiefId = '4f7c1c2e-8a4b-4d1e-9f3a-2b6c8d0e1f2a'

    expect(FiefRequestSchema.parse({ fiefId })).toEqual({ fiefId })
  })

  it('rejects a fief id that is not a uuid', () => {
    expect(FiefRequestSchema.safeParse({ fiefId: 'vado-gris' }).success).toBe(false)
  })
})
