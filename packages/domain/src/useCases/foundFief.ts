import type { DomainError } from '../DomainError'
import { Coordinates } from '../fief/Coordinates'
import { Fief } from '../fief/Fief'
import { FiefName } from '../fief/FiefName'
import { lowestFreeCell } from '../grid/lowestFreeCell'
import type { PlayerId } from '../player/PlayerId'
import type { BuildingCatalog } from '../ports/BuildingCatalog'
import type { Clock } from '../ports/Clock'
import type { FiefRepository } from '../ports/FiefRepository'
import type { IdGenerator } from '../ports/IdGenerator'
import { err, ok, type Result } from '../Result'

const FIRST_KINGDOM = 1

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
  const name = FiefName.create(command.name)
  if (!name.ok) {
    return name
  }

  if (await fiefs.holdsFief(command.playerId)) {
    return err({ kind: 'PlayerAlreadyHoldsFief', playerId: command.playerId })
  }

  const settings = catalog.fiefSettings()
  const takenPlots = (await fiefs.occupiedPlots())
    .filter(({ kingdom }) => kingdom === FIRST_KINGDOM)
    .map(({ province, plot }) => ({ row: province, column: plot }))
  const lowestFree = lowestFreeCell(takenPlots, settings.plotsPerProvince)
  if (!lowestFree.ok) {
    return lowestFree
  }
  const coordinates = Coordinates.create(
    FIRST_KINGDOM,
    lowestFree.value.row,
    lowestFree.value.column,
  )
  if (!coordinates.ok) {
    return coordinates
  }

  const fief = Fief.found({
    id: ids.newId(),
    playerId: command.playerId,
    name: name.value,
    coordinates: coordinates.value,
    startingStocks: settings.startingStocks,
    at: clock.now(),
    skills: [],
  })

  const saved = await fiefs.save(fief)
  if (!saved.ok) {
    return saved
  }
  return ok(fief)
}
