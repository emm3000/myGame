import { describe, expect, it } from 'vitest'
import { Argon2Passwords } from './Argon2Passwords'

describe('Argon2Passwords', () => {
  it('hashes a password with Argon2id', async () => {
    const passwords = new Argon2Passwords()

    expect(await passwords.hashOf('hierro-y-lana')).toMatch(/^\$argon2id\$/)
  })

  it('matches the password a hash was made from', async () => {
    const passwords = new Argon2Passwords()
    const storedHash = await passwords.hashOf('hierro-y-lana')

    expect(await passwords.matches(storedHash, 'hierro-y-lana')).toBe(true)
  })

  it('refuses another password against a hash', async () => {
    const passwords = new Argon2Passwords()
    const storedHash = await passwords.hashOf('hierro-y-lana')

    expect(await passwords.matches(storedHash, 'lana-y-hierro')).toBe(false)
  })

  it('refuses any password when no hash is stored', async () => {
    const passwords = new Argon2Passwords()

    expect(await passwords.matches(undefined, 'hierro-y-lana')).toBe(false)
  })
})
