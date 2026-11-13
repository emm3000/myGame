import { describe, expect, it } from 'vitest'
import { frameTextOf } from './frameTextOf'

describe('frameTextOf', () => {
  it("joins a frame's spans into the sentence the server sent", () => {
    expect(
      frameTextOf([
        { text: 'We have a ', support: null },
        { text: 'school', support: { shown: 'beside', text: 'escuela', language: 'es' } },
        { text: ' in our town.', support: null },
      ]),
    ).toBe('We have a school in our town.')
  })
})
