import { describe, expect, it } from 'vitest'
import { Argon2PasswordHasher } from './Argon2PasswordHasher'

describe('Argon2PasswordHasher', () => {
  it('hashes a password with Argon2id at 19 MiB, two passes and one lane', async () => {
    const passwords = new Argon2PasswordHasher()

    expect(await passwords.hashOf('hierro-y-lana')).toMatch(/^\$argon2id\$v=19\$m=19456,t=2,p=1\$/)
  })

  it('matches the password a hash was made from', async () => {
    const passwords = new Argon2PasswordHasher()
    const storedHash = await passwords.hashOf('hierro-y-lana')

    expect(await passwords.matches(storedHash, 'hierro-y-lana')).toBe(true)
  })

  it('refuses another password against a hash', async () => {
    const passwords = new Argon2PasswordHasher()
    const storedHash = await passwords.hashOf('hierro-y-lana')

    expect(await passwords.matches(storedHash, 'lana-y-hierro')).toBe(false)
  })

  it('refuses any password when no hash is stored', async () => {
    const passwords = new Argon2PasswordHasher()

    expect(await passwords.matches(undefined, 'hierro-y-lana')).toBe(false)
  })
})
