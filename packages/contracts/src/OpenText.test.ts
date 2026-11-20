import { describe, expect, it } from 'vitest'
import { OpenTextSchema } from './index'

const besideSchool = { shown: 'beside', text: 'escuela', language: 'es' }

describe('OpenTextSchema', () => {
  it('reads a text with its title and its sentences as spans', () => {
    const text = {
      id: 'text-1',
      title: 'A New Course',
      sentences: [
        [
          { text: 'We are at ', support: null },
          { text: 'school', support: besideSchool },
          { text: '.', support: null },
        ],
      ],
    }

    expect(OpenTextSchema.parse(text)).toEqual(text)
  })

  it('rejects a text without a sentence', () => {
    expect(
      OpenTextSchema.safeParse({ id: 'text-1', title: 'A New Course', sentences: [] }).success,
    ).toBe(false)
  })
})
