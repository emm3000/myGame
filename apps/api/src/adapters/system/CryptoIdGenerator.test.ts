import { describe, expect, it } from 'vitest'
import { CryptoIdGenerator } from './CryptoIdGenerator'

const uuidVersion4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/

describe('CryptoIdGenerator', () => {
  it('emits an id the uuid columns accept', () => {
    expect(new CryptoIdGenerator().newId()).toMatch(uuidVersion4)
  })

  it('never repeats an id', () => {
    const ids = new CryptoIdGenerator()

    expect(ids.newId()).not.toBe(ids.newId())
  })
})
