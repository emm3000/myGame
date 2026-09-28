import { Instant, type PlayerId } from '@mygame/domain'
import { describe, expect, it } from 'vitest'
import type { AccountToken, AccountTokens } from '../auth/AccountTokens'

export type AccountTokensFixture = {
  readonly accountTokens: AccountTokens
  readonly registerPlayers: (playerIds: ReadonlyArray<PlayerId>) => Promise<void>
}

const ana = '00000000-0000-4000-8000-000000000001'

const hoursAfterDawn = (hours: number): Instant =>
  Instant.fromEpochMilliseconds(Date.parse('2026-09-28T08:00:00Z') + hours * 3_600_000)

const dawn = hoursAfterDawn(0)

const verifyLink: AccountToken = {
  token: 'verify-link-token',
  playerId: ana,
  kind: 'verify',
  expiresAt: hoursAfterDawn(24),
}

const resetLink: AccountToken = {
  token: 'reset-link-token',
  playerId: ana,
  kind: 'reset',
  expiresAt: hoursAfterDawn(1),
}

export const accountTokensContract = (
  adapter: string,
  arrange: () => Promise<AccountTokensFixture>,
): void => {
  describe(`${adapter} as account tokens`, () => {
    it('redeems a token once', async () => {
      const { accountTokens, registerPlayers } = await arrange()
      await registerPlayers([ana])
      await accountTokens.issue(verifyLink, dawn)

      const redeemed = [
        await accountTokens.redeem(verifyLink.token, 'verify', dawn),
        await accountTokens.redeem(verifyLink.token, 'verify', dawn),
      ]

      expect(redeemed).toEqual([ana, undefined])
    })

    it('refuses an expired token', async () => {
      const { accountTokens, registerPlayers } = await arrange()
      await registerPlayers([ana])
      await accountTokens.issue(resetLink, dawn)

      expect(await accountTokens.redeem(resetLink.token, 'reset', resetLink.expiresAt)).toBe(
        undefined,
      )
    })

    it('refuses a token of the other kind', async () => {
      const { accountTokens, registerPlayers } = await arrange()
      await registerPlayers([ana])
      await accountTokens.issue(verifyLink, dawn)

      expect(await accountTokens.redeem(verifyLink.token, 'reset', dawn)).toBe(undefined)
    })

    it('refuses a token it never issued', async () => {
      const { accountTokens, registerPlayers } = await arrange()
      await registerPlayers([ana])
      await accountTokens.issue(verifyLink, dawn)

      expect(await accountTokens.redeem('forged-link-token', 'verify', dawn)).toBe(undefined)
    })

    it('invalidates the earlier token of the same kind when it issues one', async () => {
      const { accountTokens, registerPlayers } = await arrange()
      await registerPlayers([ana])
      await accountTokens.issue(verifyLink, dawn)

      await accountTokens.issue({ ...verifyLink, token: 'resent-verify-link-token' }, dawn)

      expect(await accountTokens.redeem(verifyLink.token, 'verify', dawn)).toBe(undefined)
    })

    it('keeps the live token of the other kind when it issues one', async () => {
      const { accountTokens, registerPlayers } = await arrange()
      await registerPlayers([ana])
      await accountTokens.issue(resetLink, dawn)

      await accountTokens.issue(verifyLink, dawn)

      expect(await accountTokens.redeem(resetLink.token, 'reset', dawn)).toBe(ana)
    })
  })
}
