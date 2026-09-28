import type { SignUpRequest } from '@mygame/contracts'
import {
  type BuildingCatalog,
  type Clock,
  err,
  type IdGenerator,
  ok,
  type Result,
} from '@mygame/domain'
import type { Transaction } from '../adapters/postgres/postgresTransaction'
import type { Argon2Passwords } from '../adapters/system/Argon2Passwords'
import type { CryptoSessionTokens } from '../adapters/system/CryptoSessionTokens'
import type { Refusal } from '../http/Refusal'
import { foundFiefOnFreePlot } from './foundFiefOnFreePlot'
import { issueAccountToken } from './issueAccountToken'
import { openSession } from './openSession'
import type { SignedIn } from './SignedIn'
import { type SendVerificationMailDependencies, sendVerificationMail } from './sendVerificationMail'

export type SignUpDependencies = SendVerificationMailDependencies & {
  readonly inTransaction: Transaction
  readonly buildingCatalog: BuildingCatalog
  readonly clock: Clock
  readonly ids: IdGenerator
  readonly passwords: Argon2Passwords
  readonly sessionTokens: CryptoSessionTokens
}

type SignedUp = SignedIn & {
  readonly verifyToken: string
}

export const signUp = async (
  request: SignUpRequest,
  {
    inTransaction,
    buildingCatalog,
    clock,
    ids,
    passwords,
    sessionTokens,
    mailer,
    webUrl,
  }: SignUpDependencies,
): Promise<Result<SignedIn, Refusal>> => {
  const passwordHash = await passwords.hashOf(request.password)
  const signedUp = await inTransaction<SignedUp, Refusal>(
    async ({ fiefs, accounts, accountTokens }) => {
      const player = { id: ids.newId(), email: request.email, emailVerified: false }
      const added = await accounts.addPlayer({
        id: player.id,
        email: player.email,
        passwordHash,
        createdAt: clock.now(),
      })
      if (added === 'emailTaken') {
        return err({ kind: 'EmailTaken' })
      }
      const founded = await foundFiefOnFreePlot(
        { playerId: player.id, name: request.fiefName },
        { fiefs, catalog: buildingCatalog, clock, ids },
      )
      if (!founded.ok) {
        return founded
      }
      const session = await openSession(player.id, { accounts, clock, sessionTokens })
      const verifyToken = await issueAccountToken('verify', player.id, {
        accountTokens,
        clock,
        sessionTokens,
      })
      return ok({ player, session, verifyToken })
    },
  )
  if (!signedUp.ok) {
    return signedUp
  }
  const { player, session, verifyToken } = signedUp.value
  await sendVerificationMail(player.email, verifyToken, { mailer, webUrl })
  return ok({ player, session })
}
