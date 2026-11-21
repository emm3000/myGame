import { describe, expect, it } from 'vitest'
import { CryptoSessionTokens } from './CryptoSessionTokens'

describe('CryptoSessionTokens', () => {
  it('issues a url-safe token carrying 256 random bits', () => {
    expect(new CryptoSessionTokens().newToken()).toMatch(/^[A-Za-z0-9_-]{43}$/)
  })

  it('issues a different token on every call', () => {
    const tokens = new CryptoSessionTokens()

    expect(tokens.newToken()).not.toBe(tokens.newToken())
  })
})
