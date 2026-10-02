import type { FiefList } from '@mygame/contracts'
import { type DomainError, type Fief, ok, type PlayerId, type Result } from '@mygame/domain'
import { type CurrentFiefDependencies, currentFiefOf } from './currentFiefOf'

const entryOf = (fief: Fief): FiefList['fiefs'][number] => {
  const { kingdom, province, plot } = fief.coordinates
  return { id: fief.id, name: fief.name.value, coordinates: { kingdom, province, plot } }
}

export const fiefListOf = async (
  playerId: PlayerId,
  dependencies: CurrentFiefDependencies,
): Promise<Result<FiefList, DomainError>> => {
  const fiefIds = await dependencies.fiefs.fiefsOf(playerId)
  const fiefs = await Promise.all(
    fiefIds.map((fiefId) => currentFiefOf({ playerId, fiefId }, dependencies)),
  )
  const entries: Array<FiefList['fiefs'][number]> = []
  for (const fief of fiefs) {
    if (!fief.ok) {
      return fief
    }
    entries.push(entryOf(fief.value))
  }
  return ok({ fiefs: entries })
}
