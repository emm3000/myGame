import {
  type Clock,
  type DomainError,
  type FiefId,
  type FiefOfPlayer,
  type Instant,
  ok,
  type Result,
} from '@mygame/domain'
import { fiefsOfLordHolding } from './fiefsOfLordHolding'
import { laterOf } from './laterOf'
import type { FiefMutation, FiefStores, MutateAfterResolveDependencies } from './mutateAfterResolve'
import { resolveFiefInTransaction } from './resolveFiefInTransaction'

const inLockOrder = (fiefIds: ReadonlyArray<FiefId>): ReadonlyArray<FiefId> => [...fiefIds].sort()

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

export const mutateEveryFiefAfterResolve = async <T>(
  fiefOfPlayer: FiefOfPlayer,
  mutation: FiefMutation<T>,
  dependencies: MutateAfterResolveDependencies,
): Promise<Result<T, DomainError>> =>
  dependencies.inTransaction(async (stores) => {
    const held = await fiefsOfLordHolding(fiefOfPlayer, stores.fiefs)
    if (!held.ok) {
      return held
    }
    const lordsFiefs = inLockOrder(held.value)
    const storedAts = await lockedStoredAtsOf(lordsFiefs, stores)
    if (!storedAts.ok) {
      return storedAts
    }
    const mutatedAt = storedAts.value.reduce(laterOf, dependencies.clock.now())
    const mutationClock: Clock = { now: () => mutatedAt }
    for (const fiefId of lordsFiefs) {
      const resolved = await resolveFiefInTransaction(
        { playerId: fiefOfPlayer.playerId, fiefId },
        stores,
        mutationClock,
        dependencies,
      )
      if (!resolved.ok) {
        return resolved
      }
    }
    return mutation(stores, mutationClock)
  })
