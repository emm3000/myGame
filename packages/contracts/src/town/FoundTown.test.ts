import { describe, expect, it } from 'vitest'
import { FoundTownSchema } from './index'

describe('FoundTownSchema', () => {
  it('trims the name and keeps it as written', () => {
    expect(FoundTownSchema.parse({ name: '  McAllen Heights ' })).toEqual({
      name: 'McAllen Heights',
    })
  })

  it('refuses a name of spaces as a blank one', () => {
    const parsed = FoundTownSchema.safeParse({ name: '   ' })

    expect(parsed.error?.issues.map(({ path, code }) => [path[0], code])).toEqual([
      ['name', 'too_small'],
    ])
  })
})
