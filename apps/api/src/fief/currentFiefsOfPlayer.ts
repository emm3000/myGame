import {
  type DomainError,
  type Fief,
  type FiefId,
  ok,
  type PlayerId,
  type Result,
} from '@mygame/domain'
import { type CurrentFiefDependencies, currentFiefOf } from './currentFiefOf'

const currentFiefsOf = async (
  playerId: PlayerId,
  fiefIds: ReadonlyArray<FiefId>,
  dependencies: CurrentFiefDependencies,
): Promise<Result<ReadonlyArray<Fief>, DomainError>> => {
  const fiefs = await Promise.all(
    fiefIds.map((fiefId) => currentFiefOf({ playerId, fiefId }, dependencies)),
  )
  const current: Array<Fief> = []
  for (const fief of fiefs) {
    if (!fief.ok) {
      return fief
    }
    current.push(fief.value)
  }
  return ok(current)
}

export const currentFiefsOfPlayer = async (
  playerId: PlayerId,
  dependencies: CurrentFiefDependencies,
): Promise<Result<ReadonlyArray<Fief>, DomainError>> => {
  const listed = await currentFiefsOf(
    playerId,
    await dependencies.fiefs.fiefsOf(playerId),
    dependencies,
  )
  if (!listed.ok) {
    return listed
  }
  const fiefIds = await dependencies.fiefs.fiefsOf(playerId)
  const founded = await currentFiefsOf(
    playerId,
    fiefIds.filter((fiefId) => !listed.value.some(({ id }) => id === fiefId)),
    dependencies,
  )
  if (!founded.ok) {
    return founded
  }
  const current = new Map([...listed.value, ...founded.value].map((fief) => [fief.id, fief]))
  return ok(fiefIds.flatMap((fiefId) => current.get(fiefId) ?? []))
}
