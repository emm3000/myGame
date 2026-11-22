import type { DomainError } from '#DomainError'
import type { HeldCard } from '#learning/HeldCard'
import type { CardRepository } from '#learning/ports/CardRepository'
import type { PlayerId } from '#player/PlayerId'
import type { Clock } from '#ports/Clock'
import { err, ok, type Result } from '#Result'
import type { Instant } from '#time/Instant'
import type { Hires } from '../../hiring/Hires'
import type { TownCatalog } from '../../ports/TownCatalog'
import type { TownNews } from '../../ports/TownNews'
import type { TownRepository } from '../../ports/TownRepository'
import { accrueTown } from '../../resources/accrueTown'
import { rebaseFullSince } from '../../resources/rebaseFullSince'
import { resolveStoredTown } from '../../services/resolveStoredTown'
import { saveChangedTown } from '../../services/saveChangedTown'
import type { Town } from '../../Town'
import type { BuildingKind } from '../BuildingKind'
import type { BuildingLevel } from '../BuildingLevel'
import type { BuildingLevels } from '../BuildingLevels'
import { buildPercentAt } from '../buildPercentAt'
import { deriveBuildDurationSeconds } from '../deriveBuildDurationSeconds'
import { derivePeopleForWork } from '../derivePeopleForWork'
import { wordShortfallOf } from '../wordShortfallOf'

export type StartBuildingWorkCommand = {
  readonly playerId: PlayerId
  readonly building: BuildingKind
}

export type StartBuildingWorkDependencies = {
  readonly towns: TownRepository
  readonly news: TownNews
  readonly cards: CardRepository
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
  hires: Hires,
  next: BuildingLevel,
  catalog: TownCatalog,
): Result<void, DomainError> => {
  const people = derivePeopleForWork(projected, hires, next, catalog)
  if (!people.ok) {
    return people
  }
  const { needed, freeBefore, freeAfter } = people.value
  return freeAfter < 0
    ? err({ kind: 'NotEnoughPeople', requiredPeople: needed, freePeople: freeBefore })
    : ok(undefined)
}

const meetWordNeed = (
  next: BuildingLevel,
  cards: ReadonlyArray<HeldCard>,
  catalog: TownCatalog,
): Result<void, DomainError> => {
  const shortfall = wordShortfallOf(next.level, cards, catalog.townSettings().wordNeed)
  return shortfall === null ? ok(undefined) : err({ kind: 'NotEnoughWords', ...shortfall })
}

const admitWork = (
  town: Town,
  building: BuildingKind,
  cards: ReadonlyArray<HeldCard>,
  catalog: TownCatalog,
): Result<BuildingLevel, DomainError> => {
  const room = town.buildingWork.room(catalog.townSettings().waitingListCap)
  if (!room.ok) {
    return room
  }
  const next = nextLevelOf(town.projectedLevels, building, catalog)
  if (!next.ok) {
    return next
  }
  const staffed = staffWork(town.projectedLevels, town.staffedHires, next.value, catalog)
  if (!staffed.ok) {
    return staffed
  }
  const needMet = meetWordNeed(next.value, cards, catalog)
  if (!needMet.ok) {
    return needMet
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
  const started = town.buildingWork.start(
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
  return rebaseFullSince(accrual.value.fullSince, town.changedBy(started.value), catalog)
}

export const startBuildingWork = async (
  { playerId, building }: StartBuildingWorkCommand,
  { towns, news, cards, catalog, clock }: StartBuildingWorkDependencies,
): Promise<Result<Town, DomainError>> => {
  const now = clock.now()
  const resolved = await resolveStoredTown(playerId, towns, catalog, now)
  if (!resolved.ok) {
    return resolved
  }
  const held = await cards.cardsOf(playerId)
  if (!held.ok) {
    return held
  }
  const next = admitWork(resolved.value.town, building, held.value, catalog)
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
