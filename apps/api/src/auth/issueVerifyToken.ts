import type { Clock, PlayerId } from '@mygame/domain'
import type { CryptoSessionTokens } from '../adapters/system/CryptoSessionTokens'
import type { AccountTokens } from './AccountTokens'
import { accountTokenExpiryFrom } from './accountTokenExpiryFrom'

export type IssueVerifyTokenDependencies = {
  readonly accountTokens: AccountTokens
  readonly clock: Clock
  readonly sessionTokens: CryptoSessionTokens
}

export const issueVerifyToken = async (
  playerId: PlayerId,
  { accountTokens, clock, sessionTokens }: IssueVerifyTokenDependencies,
): Promise<string> => {
  const now = clock.now()
  const token = sessionTokens.newToken()
  await accountTokens.issue(
    { token, playerId, kind: 'verify', expiresAt: accountTokenExpiryFrom('verify', now) },
    now,
  )
  return token
}
