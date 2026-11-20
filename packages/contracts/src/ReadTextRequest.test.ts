import { describe, expect, it } from 'vitest'
import { ReadTextRequestSchema } from './index'

describe('ReadTextRequestSchema', () => {
  it('parses the text the path names', () => {
    expect(ReadTextRequestSchema.parse({ textId: 'text-1' })).toEqual({ textId: 'text-1' })
  })

  it('rejects an empty text id', () => {
    expect(ReadTextRequestSchema.safeParse({ textId: '' }).success).toBe(false)
  })
})
