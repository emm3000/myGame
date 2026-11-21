import type { TownOverview } from '@mygame/contracts'
import {
  deliveredHiresOf,
  deriveHireDurationSeconds,
  type HireKind,
  hirePercentAt,
  hiringEndsAt,
  type Instant,
  requiredOfficeLevelOf,
  type Town,
  type TownCatalog,
} from '@mygame/domain'
import { isoOf } from '#platform/infrastructure/http/isoOf'
import type { TownReading } from '../../../application/TownReading'

type HireTermsState = TownOverview['hiring']['terms'][HireKind]

const hireTermsOf = (
  hire: HireKind,
  town: Town,
  catalog: TownCatalog,
  at: Instant,
): HireTermsState => {
  const { cost, durationSeconds, people } = catalog.hireTermsOf(hire)
  return {
    cost: { ...cost },
    secondsPerHire: deriveHireDurationSeconds(
      durationSeconds,
      town.buildingLevels.office,
      hirePercentAt(at, catalog.townSettings()),
    ),
    people,
    requiredOfficeLevel: requiredOfficeLevelOf(hire, catalog),
  }
}

const hiringOrderOf = (town: Town, at: Instant): TownOverview['hiring']['order'] => {
  const slot = town.hiringSlot
  if (slot.kind === 'idle') {
    return null
  }
  const { hire, count, secondsPerHire, startedAt } = slot
  return {
    hire,
    count,
    delivered: deliveredHiresOf(slot, at),
    secondsPerHire,
    startedAt: isoOf(startedAt),
    endsAt: isoOf(hiringEndsAt(slot)),
  }
}

export const presentTownHiring = (
  { town, at }: TownReading,
  catalog: TownCatalog,
): TownOverview['hiring'] => {
  const hires = town.hiresAt(at)
  return {
    order: hiringOrderOf(town, at),
    hires: { worker: hires.worker, truck: hires.truck },
    terms: {
      worker: hireTermsOf('worker', town, catalog, at),
      truck: hireTermsOf('truck', town, catalog, at),
    },
  }
}
