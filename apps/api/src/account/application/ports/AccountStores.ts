import type { Accounts } from '../../../auth/Accounts'
import type { AccountTokens } from '../../../auth/AccountTokens'

export type AccountStores = {
  readonly accounts: Accounts
  readonly accountTokens: AccountTokens
}
