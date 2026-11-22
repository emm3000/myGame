import type { Accounts } from './Accounts'
import type { AccountTokens } from './AccountTokens'
import type { Sessions } from './Sessions'

export type AccountStores = {
  readonly accounts: Accounts
  readonly accountTokens: AccountTokens
  readonly sessions: Sessions
}
