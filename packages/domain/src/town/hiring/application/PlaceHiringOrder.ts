import type { DomainError } from '#DomainError'
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
import { accrueTown } from '../../resources/accrueTown'
import { rebaseFullSince } from '../../resources/rebaseFullSince'
import { deriveHireDurationSeconds } from '../domain/deriveHireDurationSeconds'
import type { HireKind } from '../domain/HireKind'
import { hirePercentAt } from '../domain/hirePercentAt'
import { lowestFreePeopleOf } from '../domain/lowestFreePeopleOf'
import { requiredOfficeLevelOf } from '../domain/requiredOfficeLevelOf'

export type PlaceHiringOrderCommand = {
  readonly playerId: PlayerId
  readonly hire: HireKind
  readonly count: number
}

export type PlaceHiringOrderDependencies = MutateTownDependencies & {
  readonly townCatalog: TownCatalog
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
  const room = town.hiring.room()
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
  const placed = town.hiring.place(
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
  return rebaseFullSince(accrual.value.fullSince, town.changedBy(placed.value), catalog)
}

export class PlaceHiringOrder {
  constructor(private readonly dependencies: PlaceHiringOrderDependencies) {}

  async execute(command: PlaceHiringOrderCommand): Promise<Result<TownReading, DomainError>> {
    const { townCatalog } = this.dependencies
    return changeTown(
      command.playerId,
      async ({ towns, townNews }, clock) => {
        const now = clock.now()
        const resolved = await resolveStoredTown(command.playerId, towns, townCatalog, now)
        if (!resolved.ok) {
          return resolved
        }
        const town = resolved.value.town
        const admitted = admitHiring(town, command, townCatalog)
        if (!admitted.ok) {
          return admitted
        }
        const placed = placeHiringAt(town, command, townCatalog, now)
        if (!placed.ok) {
          return placed
        }
        const saved = await saveChangedTown(
          { town: placed.value, events: resolved.value.events },
          towns,
          townNews,
        )
        return saved.ok ? ok(placed.value.storedAt) : saved
      },
      this.dependencies,
    )
  }
}
