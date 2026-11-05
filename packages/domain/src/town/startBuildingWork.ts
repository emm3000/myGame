import type { DomainError } from '../DomainError'
import type { PlayerId } from '../player/PlayerId'
import type { Clock } from '../ports/Clock'
import { err, ok, type Result } from '../Result'
import { deriveBuildDurationSeconds } from '../season/deriveBuildDurationSeconds'
import type { Instant } from '../time/Instant'
import { accrueTown } from './accrueTown'
import type { BuildingKind } from './BuildingKind'
import type { BuildingLevel } from './BuildingLevel'
import type { BuildingLevels } from './BuildingLevels'
import { buildPercentAt } from './buildPercentAt'
import { derivePeople } from './derivePeople'
import { rebaseFullSince } from './rebaseFullSince'
import { resolvedTownOf } from './resolvedTownOf'
import { saveChangedTown } from './saveChangedTown'
import type { Town } from './Town'
import type { TownCatalog } from './TownCatalog'
import type { TownNews } from './TownNews'
import type { TownRepository } from './TownRepository'

export type StartBuildingWorkCommand = {
  readonly playerId: PlayerId
  readonly building: BuildingKind
}

export type StartBuildingWorkDependencies = {
  readonly towns: TownRepository
  readonly news: TownNews
  readonly catalog: TownCatalog
  readonly clock: Clock
}

const nextLevelOf = (
  levels: BuildingLevels,
  building: BuildingKind,
  catalog: TownCatalog,
): Result<BuildingLevel, DomainError> => {
  const level = levels[building]
  const next = catalog.levelOf(building, level + 1)
  if (next?.building === building) {
    return ok(next)
  }
  if (catalog.levelOf(building, 1)?.building === building) {
    return err({ kind: 'TopLevelReached', building, level })
  }
  return err({ kind: 'UnknownTownBuildingLevel', building, level: level + 1 })
}

const staffWork = (
  projected: BuildingLevels,
  next: BuildingLevel,
  catalog: TownCatalog,
): Result<void, DomainError> => {
  const before = derivePeople(projected, catalog)
  if (!before.ok) {
    return before
  }
  const after = derivePeople({ ...projected, [next.building]: next.level }, catalog)
  if (!after.ok) {
    return after
  }
  if (after.value.free < 0) {
    return err({
      kind: 'NotEnoughPeople',
      requiredPeople: after.value.occupied - before.value.occupied,
      freePeople: before.value.free,
    })
  }
  return ok(undefined)
}

const admitWork = (
  town: Town,
  building: BuildingKind,
  catalog: TownCatalog,
): Result<BuildingLevel, DomainError> => {
  const room = town.roomForWork(catalog.townSettings().waitingListCap)
  if (!room.ok) {
    return room
  }
  const next = nextLevelOf(town.projectedLevels, building, catalog)
  if (!next.ok) {
    return next
  }
  const staffed = staffWork(town.projectedLevels, next.value, catalog)
  if (!staffed.ok) {
    return staffed
  }
  return next
}

const startWorkAt = (
  town: Town,
  next: BuildingLevel,
  catalog: TownCatalog,
  now: Instant,
): Result<Town, DomainError> => {
  const accrual = accrueTown(town, catalog, now)
  if (!accrual.ok) {
    return accrual
  }
  const settings = catalog.townSettings()
  const started = town.startWork(
    {
      building: next.building,
      level: next.level,
      cost: next.cost,
      durationSeconds: deriveBuildDurationSeconds(
        next.durationSeconds,
        buildPercentAt(now, settings),
      ),
    },
    accrual.value.stocks,
    now,
    settings.waitingListCap,
  )
  if (!started.ok) {
    return started
  }
  return rebaseFullSince(accrual.value.fullSince, started.value, catalog)
}

export const startBuildingWork = async (
  { playerId, building }: StartBuildingWorkCommand,
  { towns, news, catalog, clock }: StartBuildingWorkDependencies,
): Promise<Result<Town, DomainError>> => {
  const now = clock.now()
  const resolved = await resolvedTownOf(playerId, towns, catalog, now)
  if (!resolved.ok) {
    return resolved
  }
  const next = admitWork(resolved.value.town, building, catalog)
  if (!next.ok) {
    return next
  }
  const started = startWorkAt(resolved.value.town, next.value, catalog, now)
  if (!started.ok) {
    return started
  }
  const saved = await saveChangedTown(
    { town: started.value, events: resolved.value.events },
    towns,
    news,
  )
  if (!saved.ok) {
    return saved
  }
  return ok(started.value)
}
