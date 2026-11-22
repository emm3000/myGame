import type { TownOverview } from '@mygame/contracts'
import type { Instant, ResourceKind, TownCatalog, TownReading, TownSeason } from '@mygame/domain'
import { presentScaffold } from '#account/infrastructure/http/presentScaffold'
import { isoOf } from '#platform/infrastructure/http/isoOf'
import { presentTownBuildings } from '../../building/infrastructure/http/presentTownBuildings'
import { presentTownWork } from '../../building/infrastructure/http/presentTownWork'
import { presentTownGuidance } from '../../guidance/infrastructure/http/presentTownGuidance'
import { presentTownHiring } from '../../hiring/infrastructure/http/presentTownHiring'
import { presentTownJob } from '../../jobs/infrastructure/http/presentTownJob'
import { presentTownSchool } from '../../school/infrastructure/http/presentTownSchool'
import type { StockView, TownView } from './gatherTownView'

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

const presentSeason = (season: TownSeason | null): TownOverview['season'] =>
  season === null
    ? null
    : {
        kind: season.kind,
        year: season.year,
        endsAt: isoOf(season.endsAt),
        productionPercent: { ...season.productionPercent },
        durationPercent: { ...season.durationPercent },
      }

export const presentTownOverview = (
  reading: TownReading,
  view: TownView,
  catalog: TownCatalog,
): TownOverview => {
  const { town, at } = reading
  const { region, area, site } = town.address
  return {
    name: town.name.value,
    label: view.label,
    site: { region, area, site },
    terrain: town.terrain,
    season: presentSeason(view.season),
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
    ...presentTownSchool(view.school),
    dueHoldoutChecks: view.dueHoldoutChecks.map(({ band, week }) => ({ band, week })),
    stableWordCount: view.stableWordCount,
    retainedWordCount: view.retainedWordCount,
    ...presentTownGuidance(view.guidance),
    ...presentScaffold(reading),
    readAt: isoOf(at),
  }
}
