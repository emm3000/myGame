import {
  type Clock,
  type DomainError,
  type Fief,
  type FiefId,
  type FiefOfPlayer,
  type Instant,
  ok,
  type Result,
  resolveUpgrade,
} from '@mygame/domain'
import { fiefsOfLordHolding } from './fiefsOfLordHolding'
import { laterOf } from './laterOf'
import type { FiefMutation, FiefStores, MutateAfterResolveDependencies } from './mutateAfterResolve'

const inLockOrder = (fiefIds: ReadonlyArray<FiefId>): ReadonlyArray<FiefId> =>
  [...fiefIds].sort((left, right) => (left < right ? -1 : left > right ? 1 : 0))

const lockedStoredAtsOf = async (
  fiefIds: ReadonlyArray<FiefId>,
  { fiefs }: FiefStores,
): Promise<Result<ReadonlyArray<Instant>, DomainError>> => {
  const storedAts: Array<Instant> = []
  for (const fiefId of fiefIds) {
    const locked = await fiefs.fiefOf(fiefId)
    if (!locked.ok) {
      return locked
    }
    if (locked.value !== undefined) {
      storedAts.push(locked.value.storedAt)
    }
  }
  return ok(storedAts)
}

export const mutateFiefPairAfterResolve = async (
  fiefOfPlayer: FiefOfPlayer,
  mutation: FiefMutation,
  { inTransaction, buildingCatalog, clock, ids }: MutateAfterResolveDependencies,
): Promise<Result<Fief, DomainError>> =>
  inTransaction(async ({ fiefs, chronicle, camps }) => {
    const stores = { fiefs, chronicle, camps }
    const held = await fiefsOfLordHolding(fiefOfPlayer, fiefs)
    if (!held.ok) {
      return held
    }
    const lordsFiefs = inLockOrder(held.value)
    const storedAts = await lockedStoredAtsOf(lordsFiefs, stores)
    if (!storedAts.ok) {
      return storedAts
    }
    const mutatedAt = storedAts.value.reduce(laterOf, clock.now())
    const mutationClock: Clock = { now: () => mutatedAt }
    for (const fiefId of lordsFiefs) {
      const resolved = await resolveUpgrade(
        { playerId: fiefOfPlayer.playerId, fiefId },
        { fiefs, chronicle, camps, catalog: buildingCatalog, clock: mutationClock, ids },
      )
      if (!resolved.ok) {
        return resolved
      }
    }
    return mutation(stores, mutationClock)
  })
