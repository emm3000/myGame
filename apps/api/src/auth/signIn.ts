import type { SignInRequest } from '@mygame/contracts'
import { type Clock, err, ok, type Result } from '@mygame/domain'
import type { DrizzleAccounts } from '../adapters/postgres/DrizzleAccounts'
import type { Argon2Passwords } from '../adapters/system/Argon2Passwords'
import type { CryptoSessionTokens } from '../adapters/system/CryptoSessionTokens'
import type { Refusal } from '../http/Refusal'
import { openSession } from './openSession'
import type { SignedIn } from './SignedIn'

export type SignInDependencies = {
  readonly accounts: DrizzleAccounts
  readonly clock: Clock
  readonly passwords: Argon2Passwords
  readonly sessionTokens: CryptoSessionTokens
}

export const signIn = async (
  request: SignInRequest,
  { accounts, clock, passwords, sessionTokens }: SignInDependencies,
): Promise<Result<SignedIn, Refusal>> => {
  const credentials = await accounts.credentialsOf(request.email)
  const isMatch = await passwords.matches(credentials?.passwordHash, request.password)
  if (credentials === undefined || !isMatch) {
    return err({ kind: 'InvalidCredentials' })
  }
  const session = await openSession(credentials.id, { accounts, clock, sessionTokens })
  return ok({ player: { id: credentials.id, email: credentials.email }, session })
}
