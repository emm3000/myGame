import { describe, expect, it } from 'vitest'
import { tokenDigest } from './tokenDigest'

describe('tokenDigest', () => {
  it('answers the lowercase hex sha256 of the token', () => {
    expect(tokenDigest('abc')).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    )
  })

  it('digests the utf-8 bytes of the token', () => {
    expect(tokenDigest('fogón')).toBe(
      '092a0e0d58bd6220e6835bca8dbc84d6e600cc9924d7877d002016632a95c401',
    )
  })
})
