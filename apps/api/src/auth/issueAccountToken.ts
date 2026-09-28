import type { Clock, PlayerId } from '@mygame/domain'
import type { CryptoSessionTokens } from '../adapters/system/CryptoSessionTokens'
import type { AccountTokenKind, AccountTokens } from './AccountTokens'
import { accountTokenExpiryFrom } from './accountTokenExpiryFrom'

export type IssueAccountTokenDependencies = {
  readonly accountTokens: AccountTokens
  readonly clock: Clock
  readonly sessionTokens: CryptoSessionTokens
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
