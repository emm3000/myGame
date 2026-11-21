import type { HireKind, ResourceAmounts, TownNewsItem } from '@mygame/contracts'
import type { ChromeCatalog } from '../copy/PlayerCopy'
import { amountsLineOf } from '../resources/amountsLineOf'
import { townResourceNameOf } from '../resources/townResourceNameOf'
import { formatInstant } from '../time/formatInstant'
import { placeNameOf } from '../town/placeNameOf'

export interface NewsRow {
  readonly key: string
  readonly occurredAt: string
  readonly instant: string
  readonly line: string
  readonly amounts: string | undefined
}

type NewsOf<Kind extends TownNewsItem['kind']> = Extract<TownNewsItem, { readonly kind: Kind }>

type SiteKind = 'jobBack' | 'jobCalledBack' | 'cleanUpDone' | 'cleanUpFailed'

type SiteLine = (catalog: ChromeCatalog, site: NewsOf<SiteKind>['params']['site']) => string

const hiresDelivered: Readonly<
  Record<HireKind, (catalog: ChromeCatalog, count: number) => string>
> = {
  worker: (catalog, count) => catalog.reportNewsHiringDeliveredWorker({ count }),
  truck: (catalog, count) => catalog.reportNewsHiringDeliveredTruck({ count }),
}

interface StoppedCounts {
  readonly delivered: number
  readonly count: number
}

const hiringStopped: Readonly<
  Record<HireKind, (catalog: ChromeCatalog, counts: StoppedCounts) => string>
> = {
  worker: (catalog, counts) => catalog.reportNewsHiringStoppedWorker(counts),
  truck: (catalog, counts) => catalog.reportNewsHiringStoppedTruck(counts),
}

const siteLines: Readonly<Record<SiteKind, SiteLine>> = {
  jobBack: (catalog, site) => catalog.reportNewsJobBack(site),
  jobCalledBack: (catalog, site) => catalog.reportNewsJobCalledBack(site),
  cleanUpDone: (catalog, site) => catalog.reportNewsCleanUpDone(site),
  cleanUpFailed: (catalog, site) => catalog.reportNewsCleanUpFailed(site),
}

const buildingWorkLineOf = (
  catalog: ChromeCatalog,
  { kind, params }: NewsOf<'buildingWorkFinished' | 'buildingWorkStopped'>,
): string => {
  const subject = { place: placeNameOf(catalog, params.building), level: params.level }
  return kind === 'buildingWorkFinished'
    ? catalog.reportNewsBuildingWorkFinished(subject)
    : catalog.reportNewsBuildingWorkStopped(subject)
}

const hiringLineOf = (
  catalog: ChromeCatalog,
  item: NewsOf<'hiringDelivered' | 'hiringStopped'>,
): string =>
  item.kind === 'hiringDelivered'
    ? hiresDelivered[item.params.hire](catalog, item.params.count)
    : hiringStopped[item.params.hire](catalog, {
        delivered: item.params.delivered,
        count: item.params.delivered + item.params.stopped,
      })

const skillLineOf = (catalog: ChromeCatalog, { params }: NewsOf<'skillEarned'>): string =>
  catalog.reportNewsSkillEarned({
    resource: townResourceNameOf(catalog, params.resource),
    percent: params.ratePercent,
  })

function lineOf(catalog: ChromeCatalog, item: TownNewsItem): string {
  switch (item.kind) {
    case 'buildingWorkFinished':
    case 'buildingWorkStopped':
      return buildingWorkLineOf(catalog, item)
    case 'lessonStudied':
      return catalog.reportNewsLessonStudied()
    case 'lessonStopped':
      return catalog.reportNewsLessonStopped()
    case 'skillEarned':
      return skillLineOf(catalog, item)
    case 'hiringDelivered':
    case 'hiringStopped':
      return hiringLineOf(catalog, item)
    case 'jobBack':
    case 'jobCalledBack':
    case 'cleanUpDone':
    case 'cleanUpFailed':
      return siteLines[item.kind](catalog, item.params.site)
    case 'becameCity':
      return catalog.reportNewsBecameCity()
    default: {
      const unreachable: never = item
      return unreachable
    }
  }
}

const amountsPhraseOf = (
  catalog: ChromeCatalog,
  phrase: ChromeCatalog['reportNewsPay'],
  amounts: ResourceAmounts,
): string | undefined => {
  const line = amountsLineOf(catalog, amounts)
  return line === undefined ? undefined : phrase({ amounts: line })
}

function amountsOf(catalog: ChromeCatalog, item: TownNewsItem): string | undefined {
  switch (item.kind) {
    case 'jobBack':
    case 'jobCalledBack':
      return amountsPhraseOf(catalog, catalog.reportNewsPay, item.params.pay)
    case 'cleanUpDone':
      return amountsPhraseOf(catalog, catalog.reportNewsPay, item.params.reward)
    case 'buildingWorkStopped':
    case 'hiringStopped':
      return amountsPhraseOf(catalog, catalog.reportNewsRefund, item.params.refund)
    case 'buildingWorkFinished':
    case 'lessonStudied':
    case 'lessonStopped':
    case 'skillEarned':
    case 'hiringDelivered':
    case 'cleanUpFailed':
    case 'becameCity':
      return undefined
    default: {
      const unreachable: never = item
      return unreachable
    }
  }
}

export function newsRowOf(catalog: ChromeCatalog, item: TownNewsItem, now: Date): NewsRow {
  const params = 'params' in item ? JSON.stringify(item.params) : ''
  return {
    key: `${item.kind}:${item.occurredAt}:${params}`,
    occurredAt: item.occurredAt,
    instant: formatInstant(catalog, new Date(item.occurredAt), now),
    line: lineOf(catalog, item),
    amounts: amountsOf(catalog, item),
  }
}
