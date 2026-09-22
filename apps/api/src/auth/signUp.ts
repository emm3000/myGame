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
import { openSession } from './openSession'
import type { SignedIn } from './SignedIn'

export type SignUpDependencies = {
  readonly inTransaction: Transaction
  readonly buildingCatalog: BuildingCatalog
  readonly clock: Clock
  readonly ids: IdGenerator
  readonly passwords: Argon2Passwords
  readonly sessionTokens: CryptoSessionTokens
}

export const signUp = async (
  request: SignUpRequest,
  { inTransaction, buildingCatalog, clock, ids, passwords, sessionTokens }: SignUpDependencies,
): Promise<Result<SignedIn, Refusal>> => {
  const passwordHash = await passwords.hashOf(request.password)
  return inTransaction<SignedIn, Refusal>(async ({ fiefs, accounts }) => {
    const player = { id: ids.newId(), email: request.email }
    const added = await accounts.addPlayer({ ...player, passwordHash, createdAt: clock.now() })
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
    return ok({ player, session })
  })
}
