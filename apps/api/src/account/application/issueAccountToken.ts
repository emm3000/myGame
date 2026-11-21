import type { Clock, PlayerId } from '@mygame/domain'
import { accountTokenExpiryFrom } from './accountTokenExpiryFrom'
import type { AccountTokenKind, AccountTokens } from './ports/AccountTokens'
import type { SessionTokens } from './ports/SessionTokens'

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
