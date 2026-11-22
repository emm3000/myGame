import {
  type Accounts,
  type Clock,
  err,
  ok,
  type PasswordHasher,
  type Refusal,
  type Result,
  type Sessions,
  type SessionTokens,
  type SignedIn,
} from '@mygame/domain'
import { openSession } from './openSession'

export type SignInDependencies = {
  readonly accounts: Accounts
  readonly sessions: Sessions
  readonly clock: Clock
  readonly passwords: PasswordHasher
  readonly sessionTokens: SessionTokens
}

export const signIn = async (
  request: { readonly email: string; readonly password: string },
  { accounts, sessions, clock, passwords, sessionTokens }: SignInDependencies,
): Promise<Result<SignedIn, Refusal>> => {
  const credentials = await accounts.credentialsOf(request.email)
  const isMatch = await passwords.matches(credentials?.passwordHash, request.password)
  if (credentials === undefined || !isMatch) {
    return err({ kind: 'InvalidCredentials' })
  }
  const session = await openSession(credentials.id, { sessions, clock, sessionTokens })
  const { passwordHash: _, ...player } = credentials
  return ok({ player, session })
}
