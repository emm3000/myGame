import { type Accounts, Instant, type NewPlayer } from '@mygame/domain'
import { assert, describe, expect, it } from 'vitest'

const ana = '00000000-0000-4000-8000-000000000001'
const bruno = '00000000-0000-4000-8000-000000000002'

const signedUpAt = Instant.fromEpochMilliseconds(Date.parse('2026-11-04T08:00:00Z'))

const newPlayer = (id: string, email: string): NewPlayer => ({
  id,
  email,
  passwordHash: 'argon2id-hash',
  createdAt: signedUpAt,
  scaffold: 'es',
})

export const accountsContract = (adapterName: string, arrange: () => Promise<Accounts>): void => {
  describe(`${adapterName} as Accounts`, () => {
    it('adds a player unverified at the first scaffold version', async () => {
      const accounts = await arrange()

      const added = await accounts.addPlayer(newPlayer(ana, 'ana@example.com'))

      expect(added).toEqual({
        kind: 'added',
        player: {
          id: ana,
          email: 'ana@example.com',
          emailVerified: false,
          scaffold: 'es',
          scaffoldVersion: 0,
        },
      })
    })

    it('refuses a second player whose email differs only in case as an email taken', async () => {
      const accounts = await arrange()
      await accounts.addPlayer(newPlayer(ana, 'ana@example.com'))

      expect(await accounts.addPlayer(newPlayer(bruno, 'Ana@Example.com'))).toEqual({
        kind: 'emailTaken',
      })
    })

    it('finds the credentials by an email written in any case', async () => {
      const accounts = await arrange()
      await accounts.addPlayer(newPlayer(ana, 'ana@example.com'))

      expect((await accounts.credentialsOf('ANA@example.com'))?.id).toBe(ana)
    })

    it('answers no player and no credentials for an account never added', async () => {
      const accounts = await arrange()

      expect([
        await accounts.playerOf(ana),
        await accounts.credentialsOf('ana@example.com'),
      ]).toEqual([undefined, undefined])
    })

    it('reads the player marked verified after the email is verified', async () => {
      const accounts = await arrange()
      await accounts.addPlayer(newPlayer(ana, 'ana@example.com'))

      await accounts.markEmailVerified(ana, signedUpAt)

      expect((await accounts.playerOf(ana))?.emailVerified).toBe(true)
    })

    it('answers the new password hash with the credentials', async () => {
      const accounts = await arrange()
      await accounts.addPlayer(newPlayer(ana, 'ana@example.com'))

      await accounts.storePasswordHash(ana, 'argon2id-new-hash')

      expect((await accounts.credentialsOf('ana@example.com'))?.passwordHash).toBe(
        'argon2id-new-hash',
      )
    })

    it('stores a new scaffold one version past the last', async () => {
      const accounts = await arrange()
      await accounts.addPlayer(newPlayer(ana, 'ana@example.com'))

      const stored = await accounts.storeScaffold(ana, 'none')

      assert(stored.scaffold === 'none')
      expect([stored.scaffoldVersion, (await accounts.playerOf(ana))?.scaffoldVersion]).toEqual([
        1, 1,
      ])
    })

    it('refuses to store a scaffold for a player who holds no account', async () => {
      const accounts = await arrange()

      await expect(accounts.storeScaffold(ana, 'none')).rejects.toThrow()
    })
  })
}
