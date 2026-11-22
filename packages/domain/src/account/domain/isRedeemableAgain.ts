import type { AccountTokenKind } from './AccountTokens'

const redeemableAgain: Readonly<Record<AccountTokenKind, boolean>> = {
  reset: false,
  verify: true,
}

export const isRedeemableAgain = (kind: AccountTokenKind): boolean => redeemableAgain[kind]
