import { PlacementBandSchema, type TownOverview } from '@mygame/contracts'
import {
  type DomainError,
  dueHoldoutChecksOf,
  type Instant,
  type MemoryTerms,
  ok,
  type ResourceKind,
  type Result,
  releasedLessonsOf,
  retainedWordCountOf,
  stableWordCountOf,
  type TownCatalog,
  townSeasonAt,
} from '@mygame/domain'
import { presentScaffold } from '#account/infrastructure/http/presentScaffold'
import type { LessonLibrary } from '#content/application/ports/LessonLibrary'
import { isoOf } from '#platform/infrastructure/http/isoOf'
import type { StockView, TownView } from '../../application/gatherTownView'
import type { TownReading } from '../../application/TownReading'
import { presentTownBuildings } from '../../building/infrastructure/http/presentTownBuildings'
import { presentTownWork } from '../../building/infrastructure/http/presentTownWork'
import { presentTownGuidance } from '../../guidance/infrastructure/http/presentTownGuidance'
import { presentTownHiring } from '../../hiring/infrastructure/http/presentTownHiring'
import { presentTownJob } from '../../jobs/infrastructure/http/presentTownJob'
import { presentTownSchool } from '../../school/infrastructure/http/presentTownSchool'

const isoOrNullOf = (instant: Instant | null): string | null =>
  instant === null ? null : isoOf(instant)

const presentStock = ({
  amount,
  ratePerHour,
  capacity,
  fullAt,
}: StockView): TownOverview['stocks'][ResourceKind] => ({
  amount,
  ratePerHour,
  capacity,
  fullAt: isoOrNullOf(fullAt),
})

const presentStocks = (stocks: TownView['stocks']): TownOverview['stocks'] => ({
  money: presentStock(stocks.money),
  food: presentStock(stocks.food),
  power: presentStock(stocks.power),
  material: presentStock(stocks.material),
})

const seasonOf = (at: Instant, catalog: TownCatalog): TownOverview['season'] => {
  const season = townSeasonAt(at, catalog.townSettings())
  return season === undefined
    ? null
    : {
        kind: season.kind,
        year: season.year,
        endsAt: isoOf(season.endsAt),
        productionPercent: { ...season.productionPercent },
        durationPercent: { ...season.durationPercent },
      }
}

export const presentTownOverview = (
  reading: TownReading,
  view: TownView,
  catalog: TownCatalog,
  lessons: LessonLibrary,
  memoryTerms: MemoryTerms,
): Result<TownOverview, DomainError> => {
  const { town, at } = reading
  const released = releasedLessonsOf(reading.bandStarts, reading.cards, {
    lessons,
    bands: lessons,
  })
  const school = presentTownSchool(reading, catalog, lessons, released, memoryTerms)
  if (!school.ok) {
    return school
  }
  const guidance = presentTownGuidance(reading, released, catalog, lessons, memoryTerms)
  if (!guidance.ok) {
    return guidance
  }
  const { region, area, site } = town.address
  return ok({
    name: town.name.value,
    label: view.label,
    site: { region, area, site },
    terrain: town.terrain,
    season: seasonOf(at, catalog),
    stocks: presentStocks(view.stocks),
    people: {
      supplied: view.people.supplied,
      free: view.people.free,
      atWork: view.people.occupied,
    },
    buildings: presentTownBuildings(view.buildings),
    work: presentTownWork(view.work),
    hiring: presentTownHiring(reading, catalog),
    job: presentTownJob(town, at),
    ...school.value,
    dueHoldoutChecks: dueHoldoutChecksOf(reading.bandStarts, at).map(({ band, week }) => ({
      band: PlacementBandSchema.parse(band),
      week,
    })),
    stableWordCount: stableWordCountOf(reading.cards),
    retainedWordCount: retainedWordCountOf(reading.cards),
    ...guidance.value,
    ...presentScaffold(reading),
    readAt: isoOf(at),
  })
}
