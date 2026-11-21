import type { SignInRequest } from '@mygame/contracts'
import { type Clock, err, ok, type Result } from '@mygame/domain'
import type { PasswordHasher } from '../account/application/ports/PasswordHasher'
import type { SessionTokens } from '../account/application/ports/SessionTokens'
import type { Refusal } from '../platform/application/Refusal'
import type { Accounts } from './Accounts'
import { openSession } from './openSession'
import type { SignedIn } from './SignedIn'

export type SignInDependencies = {
  readonly accounts: Accounts
  readonly clock: Clock
  readonly passwords: PasswordHasher
  readonly sessionTokens: SessionTokens
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
  const { passwordHash: _, ...player } = credentials
  return ok({ player, session })
}
