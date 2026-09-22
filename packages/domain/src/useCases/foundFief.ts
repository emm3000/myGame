import type { DomainError } from '../DomainError'
import { Fief } from '../fief/Fief'
import { lowestFreeCoordinates } from '../fief/lowestFreeCoordinates'
import type { PlayerId } from '../player/PlayerId'
import type { BuildingCatalog } from '../ports/BuildingCatalog'
import type { Clock } from '../ports/Clock'
import type { FiefRepository } from '../ports/FiefRepository'
import type { IdGenerator } from '../ports/IdGenerator'
import { err, type Result } from '../Result'

export type FoundFiefCommand = {
  readonly playerId: PlayerId
  readonly name: string
}

export type FoundFiefDependencies = {
  readonly fiefs: FiefRepository
  readonly catalog: BuildingCatalog
  readonly clock: Clock
  readonly ids: IdGenerator
}

export const foundFief = async (
  command: FoundFiefCommand,
  { fiefs, catalog, clock, ids }: FoundFiefDependencies,
): Promise<Result<Fief, DomainError>> => {
  if (await fiefs.holdsFief(command.playerId)) {
    return err({ kind: 'PlayerAlreadyHoldsFief', playerId: command.playerId })
  }

  const settings = catalog.fiefSettings()
  const coordinates = lowestFreeCoordinates(
    await fiefs.occupiedCoordinates(),
    settings.plotsPerProvince,
  )
  if (!coordinates.ok) {
    return coordinates
  }

  const founded = Fief.found({
    id: ids.newId(),
    playerId: command.playerId,
    name: command.name,
    coordinates: coordinates.value,
    startingStocks: settings.startingStocks,
    at: clock.now(),
  })
  if (!founded.ok) {
    return founded
  }

  await fiefs.save(founded.value)
  return founded
}
