import type { DomainError } from '#DomainError'
import type { HeldCard } from '#learning/HeldCard'
import type { PlayerId } from '#player/PlayerId'
import { err, ok, type Result } from '#Result'
import type { Instant } from '#time/Instant'
import { changeTown } from '../../application/changeTown'
import type { MutateTownDependencies } from '../../application/mutateTown'
import { resolveStoredTown } from '../../application/resolveStoredTown'
import { saveChangedTown } from '../../application/saveChangedTown'
import type { Town } from '../../domain/Town'
import type { TownCatalog } from '../../domain/TownCatalog'
import type { TownReading } from '../../domain/TownReading'
import type { Hires } from '../../hiring/Hires'
import { accrueTown } from '../../resources/accrueTown'
import { rebaseFullSince } from '../../resources/rebaseFullSince'
import type { BuildingKind } from '../domain/BuildingKind'
import type { BuildingLevel } from '../domain/BuildingLevel'
import type { BuildingLevels } from '../domain/BuildingLevels'
import { derivePeopleForWork } from '../domain/derivePeopleForWork'
import { levelWorkAt } from '../domain/levelWorkAt'
import { wordShortfallOf } from '../domain/wordShortfallOf'

export type StartBuildingWorkCommand = {
  readonly playerId: PlayerId
  readonly building: BuildingKind
}

export type StartBuildingWorkDependencies = MutateTownDependencies & {
  readonly townCatalog: TownCatalog
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
    levelWorkAt(next, now, settings),
    accrual.value.stocks,
    now,
    settings.waitingListCap,
  )
  if (!started.ok) {
    return started
  }
  return rebaseFullSince(accrual.value.fullSince, town.changedBy(started.value), catalog)
}

export class StartBuildingWork {
  constructor(private readonly dependencies: StartBuildingWorkDependencies) {}

  async execute({
    playerId,
    building,
  }: StartBuildingWorkCommand): Promise<Result<TownReading, DomainError>> {
    const { townCatalog } = this.dependencies
    return changeTown(
      playerId,
      async ({ towns, townNews, cards }, clock) => {
        const now = clock.now()
        const resolved = await resolveStoredTown(playerId, towns, townCatalog, now)
        if (!resolved.ok) {
          return resolved
        }
        const held = await cards.cardsOf(playerId)
        if (!held.ok) {
          return held
        }
        const next = admitWork(resolved.value.town, building, held.value, townCatalog)
        if (!next.ok) {
          return next
        }
        const started = startWorkAt(resolved.value.town, next.value, townCatalog, now)
        if (!started.ok) {
          return started
        }
        const saved = await saveChangedTown(
          { town: started.value, events: resolved.value.events },
          towns,
          townNews,
        )
        return saved.ok ? ok(started.value.storedAt) : saved
      },
      this.dependencies,
    )
  }
}
