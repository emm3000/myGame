import type { DomainError } from '../DomainError'
import { derivePeasantsForUpgrade } from '../fief/derivePeasantsForUpgrade'
import { deriveProjectedFreePeasants } from '../fief/deriveProjectedFreePeasants'
import type { Fief } from '../fief/Fief'
import type { FiefBuildingLevels } from '../fief/FiefBuildingLevels'
import { materializeStocks } from '../fief/materializeStocks'
import type { PlayerId } from '../player/PlayerId'
import type { BuildingCatalog, BuildingKind, BuildingLevel } from '../ports/BuildingCatalog'
import type { Clock } from '../ports/Clock'
import type { FiefRepository } from '../ports/FiefRepository'
import { err, ok, type Result } from '../Result'
import type { Instant } from '../time/Instant'

export type EnqueueBuildingCommand = {
  readonly playerId: PlayerId
  readonly building: BuildingKind
}

export type EnqueueBuildingDependencies = {
  readonly fiefs: FiefRepository
  readonly catalog: BuildingCatalog
  readonly clock: Clock
}

const isKnownLevel = (
  found: BuildingLevel | undefined,
  building: BuildingKind,
): found is BuildingLevel => found !== undefined && found.building === building

const nextLevelOf = (
  buildingLevels: FiefBuildingLevels,
  building: BuildingKind,
  catalog: BuildingCatalog,
): Result<BuildingLevel, DomainError> => {
  const currentLevel = buildingLevels[building]
  const next = catalog.levelOf(building, currentLevel + 1)
  if (isKnownLevel(next, building)) {
    return ok(next)
  }
  if (isKnownLevel(catalog.levelOf(building, 1), building)) {
    return err({ kind: 'MaxLevelReached', building, level: currentLevel })
  }
  return err({ kind: 'UnknownBuilding', building })
}

const staffUpgrade = (
  fief: Fief,
  target: BuildingLevel,
  catalog: BuildingCatalog,
): Result<void, DomainError> => {
  const freeAfterQueue = deriveProjectedFreePeasants(fief, catalog)
  if (!freeAfterQueue.ok) {
    return freeAfterQueue
  }
  const required = derivePeasantsForUpgrade(
    fief.projectedBuildingLevels,
    target.building,
    target.level,
    catalog,
  )
  if (!required.ok) {
    return required
  }
  const requiredPeasants = required.value
  const freePeasants = freeAfterQueue.value
  if (requiredPeasants > freePeasants) {
    return err({ kind: 'NotEnoughPeasants', requiredPeasants, freePeasants })
  }
  return ok(undefined)
}

const enqueueUpgradeAt = (
  fief: Fief,
  target: BuildingLevel,
  catalog: BuildingCatalog,
  now: Instant,
): Result<Fief, DomainError> => {
  const stocksAtNow = materializeStocks(fief, catalog, now)
  if (!stocksAtNow.ok) {
    return stocksAtNow
  }
  return fief.enqueueUpgrade(
    {
      building: target.building,
      targetLevel: target.level,
      cost: target.cost,
      durationSeconds: target.durationSeconds,
    },
    stocksAtNow.value,
    now,
    catalog.fiefSettings().buildQueueCap,
  )
}

export const enqueueBuilding = async (
  command: EnqueueBuildingCommand,
  { fiefs, catalog, clock }: EnqueueBuildingDependencies,
): Promise<Result<Fief, DomainError>> => {
  const stored = await fiefs.fiefOf(command.playerId)
  if (!stored.ok) {
    return stored
  }
  const fief = stored.value
  if (fief === undefined) {
    return err({ kind: 'FiefNotFound', playerId: command.playerId })
  }

  const target = nextLevelOf(fief.projectedBuildingLevels, command.building, catalog)
  if (!target.ok) {
    return target
  }
  const staffed = staffUpgrade(fief, target.value, catalog)
  if (!staffed.ok) {
    return staffed
  }

  const upgraded = enqueueUpgradeAt(fief, target.value, catalog, clock.now())
  if (!upgraded.ok) {
    return upgraded
  }
  const saved = await fiefs.save(upgraded.value)
  if (!saved.ok) {
    return saved
  }
  return ok(upgraded.value)
}
