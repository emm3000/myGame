import {
  reportNewsBecameCity,
  reportNewsBuildingWorkFinished,
  reportNewsBuildingWorkStopped,
  reportNewsCleanUpDone,
  reportNewsCleanUpFailed,
  reportNewsHiringDeliveredTruck,
  reportNewsHiringDeliveredWorker,
  reportNewsHiringStoppedTruck,
  reportNewsHiringStoppedWorker,
  reportNewsJobBack,
  reportNewsJobCalledBack,
  reportNewsLessonStopped,
  reportNewsLessonStudied,
  reportNewsPay,
  reportNewsRefund,
  reportNewsSkillEarned,
} from '@mygame/catalog'
import type { HireKind, ResourceAmounts, TownNewsItem } from '@mygame/contracts'
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

const hiresDelivered: Readonly<Record<HireKind, (count: number) => string>> = {
  worker: (count) => reportNewsHiringDeliveredWorker({ count }),
  truck: (count) => reportNewsHiringDeliveredTruck({ count }),
}

const hiringStopped: Readonly<Record<HireKind, typeof reportNewsHiringStoppedWorker>> = {
  worker: reportNewsHiringStoppedWorker,
  truck: reportNewsHiringStoppedTruck,
}

const siteLines: Readonly<
  Record<'jobBack' | 'jobCalledBack' | 'cleanUpDone' | 'cleanUpFailed', typeof reportNewsJobBack>
> = {
  jobBack: reportNewsJobBack,
  jobCalledBack: reportNewsJobCalledBack,
  cleanUpDone: reportNewsCleanUpDone,
  cleanUpFailed: reportNewsCleanUpFailed,
}

const buildingWorkLineOf = ({
  kind,
  params,
}: NewsOf<'buildingWorkFinished' | 'buildingWorkStopped'>): string => {
  const subject = { place: placeNameOf(params.building), level: params.level }
  return kind === 'buildingWorkFinished'
    ? reportNewsBuildingWorkFinished(subject)
    : reportNewsBuildingWorkStopped(subject)
}

const hiringLineOf = (item: NewsOf<'hiringDelivered' | 'hiringStopped'>): string =>
  item.kind === 'hiringDelivered'
    ? hiresDelivered[item.params.hire](item.params.count)
    : hiringStopped[item.params.hire]({
        delivered: item.params.delivered,
        count: item.params.delivered + item.params.stopped,
      })

const skillLineOf = ({ params }: NewsOf<'skillEarned'>): string =>
  reportNewsSkillEarned({
    resource: townResourceNameOf(params.resource),
    percent: params.ratePercent,
  })

function lineOf(item: TownNewsItem): string {
  switch (item.kind) {
    case 'buildingWorkFinished':
    case 'buildingWorkStopped':
      return buildingWorkLineOf(item)
    case 'lessonStudied':
      return reportNewsLessonStudied()
    case 'lessonStopped':
      return reportNewsLessonStopped()
    case 'skillEarned':
      return skillLineOf(item)
    case 'hiringDelivered':
    case 'hiringStopped':
      return hiringLineOf(item)
    case 'jobBack':
    case 'jobCalledBack':
    case 'cleanUpDone':
    case 'cleanUpFailed':
      return siteLines[item.kind](item.params.site)
    case 'becameCity':
      return reportNewsBecameCity()
    default: {
      const unreachable: never = item
      return unreachable
    }
  }
}

const amountsPhraseOf = (
  phrase: typeof reportNewsPay,
  amounts: ResourceAmounts,
): string | undefined => {
  const line = amountsLineOf(amounts)
  return line === undefined ? undefined : phrase({ amounts: line })
}

function amountsOf(item: TownNewsItem): string | undefined {
  switch (item.kind) {
    case 'jobBack':
    case 'jobCalledBack':
      return amountsPhraseOf(reportNewsPay, item.params.pay)
    case 'cleanUpDone':
      return amountsPhraseOf(reportNewsPay, item.params.reward)
    case 'buildingWorkStopped':
    case 'hiringStopped':
      return amountsPhraseOf(reportNewsRefund, item.params.refund)
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

export function newsRowOf(item: TownNewsItem, now: Date): NewsRow {
  const params = 'params' in item ? JSON.stringify(item.params) : ''
  return {
    key: `${item.kind}:${item.occurredAt}:${params}`,
    occurredAt: item.occurredAt,
    instant: formatInstant(new Date(item.occurredAt), now),
    line: lineOf(item),
    amounts: amountsOf(item),
  }
}
