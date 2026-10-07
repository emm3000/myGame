import { type DomainError, type FiefId, ok, type PlayerId, type Result } from '@mygame/domain'
import { type CurrentFiefDependencies, currentFiefOf } from './currentFiefOf'
import type { FiefReading } from './FiefReading'

const currentFiefsOf = async (
  playerId: PlayerId,
  fiefIds: ReadonlyArray<FiefId>,
  dependencies: CurrentFiefDependencies,
): Promise<Result<ReadonlyArray<FiefReading>, DomainError>> => {
  const readings = await Promise.all(
    fiefIds.map((fiefId) => currentFiefOf({ playerId, fiefId }, dependencies)),
  )
  const current: Array<FiefReading> = []
  for (const reading of readings) {
    if (!reading.ok) {
      return reading
    }
    current.push(reading.value)
  }
  return ok(current)
}

export const currentFiefsOfPlayer = async (
  playerId: PlayerId,
  dependencies: CurrentFiefDependencies,
): Promise<Result<ReadonlyArray<FiefReading>, DomainError>> => {
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
    fiefIds.filter((fiefId) => !listed.value.some(({ fief }) => fief.id === fiefId)),
    dependencies,
  )
  if (!founded.ok) {
    return founded
  }
  const current = new Map(
    [...listed.value, ...founded.value].map((reading) => [reading.fief.id, reading]),
  )
  return ok(fiefIds.flatMap((fiefId) => current.get(fiefId) ?? []))
}
