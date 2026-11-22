import {
  type AccountTokenKind,
  type AccountTokens,
  accountTokenExpiryFrom,
  type Clock,
  type PlayerId,
  type SessionTokens,
} from '@mygame/domain'

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
