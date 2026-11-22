import type { Clock } from '#platform/domain/Clock'
import type { PlayerId } from '#player/PlayerId'
import type { AccountTokenKind, AccountTokens } from '../domain/AccountTokens'
import { accountTokenExpiryFrom } from '../domain/accountTokenExpiryFrom'
import type { SessionTokens } from '../domain/SessionTokens'

export type IssueAccountTokenDependencies = {
  readonly accountTokens: AccountTokens
  readonly clock: Clock
  readonly sessionTokens: SessionTokens
}

export const issueAccountToken = async (
  kind: AccountTokenKind,
  playerId: PlayerId,
  { accountTokens, clock, sessionTokens }: IssueAccountTokenDependencies,
): Promise<string> => {
  const now = clock.now()
  const token = sessionTokens.newToken()
  await accountTokens.issue(
    { token, playerId, kind, expiresAt: accountTokenExpiryFrom(kind, now) },
    now,
  )
  return token
}
