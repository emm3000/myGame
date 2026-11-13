import type { DomainError } from '../DomainError'
import { err, ok, type Result } from '../Result'
import type { Instant } from '../time/Instant'
import { accrueTown } from './accrueTown'
import { buildingKinds } from './buildingKinds'
import { derivePeople } from './derivePeople'
import { hireKinds } from './hireKinds'
import { resourceKinds } from './resourceKinds'
import { seasonPercentsAt } from './seasonPercentsAt'
import type { TipKind } from './TipKind'
import type { Town } from './Town'
import type { TownCatalog } from './TownCatalog'

export type TipReading = {
  readonly town: Town
  readonly at: Instant
  readonly seenTips: ReadonlyArray<TipKind>
}

type Trigger = (reading: TipReading, catalog: TownCatalog) => Result<boolean, DomainError>

const UNCHANGED_PERCENT = 100

const lacksPeople: Trigger = ({ town }, catalog) => {
  const projected = town.projectedLevels
  for (const building of buildingKinds) {
    const next = catalog.levelOf(building, projected[building] + 1)
    if (next === undefined) {
      continue
    }
    const people = derivePeople(
      { ...projected, [building]: next.level },
      town.staffedHires,
      catalog,
    )
    if (!people.ok) {
      return people
    }
    if (people.value.free < 0) {
      return ok(true)
    }
  }
  return ok(false)
}

const changesProduction: Trigger = ({ at }, catalog) => {
  const percent = seasonPercentsAt(at, catalog.townSettings()).productionPercent
  return ok(resourceKinds.some((resource) => percent[resource] !== UNCHANGED_PERCENT))
}

const holdsHireAtHome: Trigger = ({ town, at }) => {
  const atHome = town.hiresAtHomeAt(at)
  return ok(hireKinds.some((hire) => atHome[hire] > 0))
}

const holdsFullStore: Trigger = ({ town, at }, catalog) => {
  const accrual = accrueTown(town, catalog, at)
  if (!accrual.ok) {
    return accrual
  }
  const { fullSince } = accrual.value
  return ok(resourceKinds.some((resource) => fullSince[resource] !== null))
}

const triggers: Readonly<Record<TipKind, Trigger>> = {
  people: lacksPeople,
  seasons: changesProduction,
  waitingList: ({ town }) => ok(town.workSlot.kind === 'busy'),
  office: ({ town }) => ok(town.buildingLevels.office > 0),
  jobs: holdsHireAtHome,
  fullStore: holdsFullStore,
}

export const tipOf = (
  reading: TipReading,
  catalog: TownCatalog,
): Result<TipKind | undefined, DomainError> => {
  const { town, at } = reading
  if (at.epochMilliseconds < town.storedAt.epochMilliseconds) {
    return err({ kind: 'InstantBeforeStored', storedAt: town.storedAt, now: at })
  }
  const unseen = catalog.townSettings().tips.filter((tip) => !reading.seenTips.includes(tip))
  for (const tip of unseen) {
    const matters = triggers[tip](reading, catalog)
    if (!matters.ok) {
      return matters
    }
    if (matters.value) {
      return ok(tip)
    }
  }
  return ok(undefined)
}
