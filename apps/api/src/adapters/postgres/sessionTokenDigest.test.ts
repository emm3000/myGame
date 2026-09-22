import { describe, expect, it } from 'vitest'
import { sessionTokenDigest } from './sessionTokenDigest'

describe('sessionTokenDigest', () => {
  it('answers the lowercase hex sha256 of the token', () => {
    expect(sessionTokenDigest('abc')).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    )
  })

  it('digests the utf-8 bytes of the token', () => {
    expect(sessionTokenDigest('fogón')).toBe(
      '092a0e0d58bd6220e6835bca8dbc84d6e600cc9924d7877d002016632a95c401',
    )
  })
})
