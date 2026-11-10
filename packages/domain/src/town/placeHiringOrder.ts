import type { DomainError } from '../DomainError'
import type { PlayerId } from '../player/PlayerId'
import type { Clock } from '../ports/Clock'
import { err, ok, type Result } from '../Result'
import type { Instant } from '../time/Instant'
import { accrueTown } from './accrueTown'
import { deriveHireDurationSeconds } from './deriveHireDurationSeconds'
import type { HireKind } from './HireKind'
import { hirePercentAt } from './hirePercentAt'
import { lowestFreePeopleOf } from './lowestFreePeopleOf'
import { rebaseFullSince } from './rebaseFullSince'
import { requiredOfficeLevelOf } from './requiredOfficeLevelOf'
import { resolvedTownOf } from './resolvedTownOf'
import { saveChangedTown } from './saveChangedTown'
import type { Town } from './Town'
import type { TownCatalog } from './TownCatalog'
import type { TownNews } from './TownNews'
import type { TownRepository } from './TownRepository'

export type PlaceHiringOrderCommand = {
  readonly playerId: PlayerId
  readonly hire: HireKind
  readonly count: number
}

export type PlaceHiringOrderDependencies = {
  readonly towns: TownRepository
  readonly news: TownNews
  readonly catalog: TownCatalog
  readonly clock: Clock
}

const admitOffice = (
  town: Town,
  hire: HireKind,
  catalog: TownCatalog,
): Result<void, DomainError> => {
  const officeLevel = town.buildingLevels.office
  const offered = catalog.levelOf('office', officeLevel)
  if (offered?.building === 'office' && offered.hires.includes(hire)) {
    return ok(undefined)
  }
  return err({
    kind: 'OfficeTooLow',
    hire,
    requiredOfficeLevel: requiredOfficeLevelOf(hire, catalog),
    officeLevel,
  })
}

const staffHiring = (
  town: Town,
  { hire, count }: PlaceHiringOrderCommand,
  catalog: TownCatalog,
): Result<void, DomainError> => {
  const freePeople = lowestFreePeopleOf(town, catalog)
  if (!freePeople.ok) {
    return freePeople
  }
  const requiredPeople = count * catalog.hireTermsOf(hire).people
  if (requiredPeople > freePeople.value) {
    return err({ kind: 'NotEnoughPeople', requiredPeople, freePeople: freePeople.value })
  }
  return ok(undefined)
}

const admitHiring = (
  town: Town,
  command: PlaceHiringOrderCommand,
  catalog: TownCatalog,
): Result<void, DomainError> => {
  const { hire, count } = command
  if (!Number.isInteger(count) || count < 1) {
    return err({ kind: 'InvalidHireCount', hire, count })
  }
  const office = admitOffice(town, hire, catalog)
  if (!office.ok) {
    return office
  }
  const room = town.roomForHiring()
  if (!room.ok) {
    return room
  }
  return staffHiring(town, command, catalog)
}

const placeHiringAt = (
  town: Town,
  { hire, count }: PlaceHiringOrderCommand,
  catalog: TownCatalog,
  now: Instant,
): Result<Town, DomainError> => {
  const accrual = accrueTown(town, catalog, now)
  if (!accrual.ok) {
    return accrual
  }
  const terms = catalog.hireTermsOf(hire)
  const placed = town.placeHiring(
    {
      kind: 'busy',
      hire,
      count,
      costPerHire: terms.cost,
      secondsPerHire: deriveHireDurationSeconds(
        terms.durationSeconds,
        town.buildingLevels.office,
        hirePercentAt(now, catalog.townSettings()),
      ),
      startedAt: now,
    },
    accrual.value.stocks,
    now,
  )
  if (!placed.ok) {
    return placed
  }
  return rebaseFullSince(accrual.value.fullSince, placed.value, catalog)
}

export const placeHiringOrder = async (
  command: PlaceHiringOrderCommand,
  { towns, news, catalog, clock }: PlaceHiringOrderDependencies,
): Promise<Result<Town, DomainError>> => {
  const now = clock.now()
  const resolved = await resolvedTownOf(command.playerId, towns, catalog, now)
  if (!resolved.ok) {
    return resolved
  }
  const town = resolved.value.town
  const admitted = admitHiring(town, command, catalog)
  if (!admitted.ok) {
    return admitted
  }
  const placed = placeHiringAt(town, command, catalog, now)
  if (!placed.ok) {
    return placed
  }
  const saved = await saveChangedTown(
    { town: placed.value, events: resolved.value.events },
    towns,
    news,
  )
  if (!saved.ok) {
    return saved
  }
  return ok(placed.value)
}
