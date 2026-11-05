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
  reportNewsSkillEarned,
  townAmount,
} from '@mygame/catalog'
import {
  type HireKind,
  type ResourceAmounts,
  ResourceKindSchema,
  type TownNewsItem,
} from '@mygame/contracts/town'
import { conjunctionOf } from '../design-system/conjunctionOf'
import { formatQuantity } from '../design-system/formatQuantity'
import { townResourceNameOf } from '../resources/townResourceNameOf'
import { formatInstant } from '../time/formatInstant'
import { placeNameOf } from '../town/placeNameOf'

export interface ReportNewsRow {
  readonly key: string
  readonly occurredAt: string
  readonly instant: string
  readonly line: string
  readonly pay: string | undefined
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

const payPhraseOf = (amounts: ResourceAmounts): string | undefined => {
  const quantities = ResourceKindSchema.options
    .filter((resource) => amounts[resource] > 0)
    .map((resource) =>
      townAmount({
        amount: formatQuantity(amounts[resource]),
        resource: townResourceNameOf(resource),
      }),
    )
  return quantities.length === 0 ? undefined : reportNewsPay({ amounts: conjunctionOf(quantities) })
}

function payOf(item: TownNewsItem): string | undefined {
  switch (item.kind) {
    case 'jobBack':
    case 'jobCalledBack':
      return payPhraseOf(item.params.pay)
    case 'cleanUpDone':
      return payPhraseOf(item.params.reward)
    case 'buildingWorkFinished':
    case 'buildingWorkStopped':
    case 'lessonStudied':
    case 'lessonStopped':
    case 'skillEarned':
    case 'hiringDelivered':
    case 'hiringStopped':
    case 'cleanUpFailed':
    case 'becameCity':
      return undefined
    default: {
      const unreachable: never = item
      return unreachable
    }
  }
}

export function reportNewsRowOf(item: TownNewsItem, now: Date): ReportNewsRow {
  const params = 'params' in item ? JSON.stringify(item.params) : ''
  return {
    key: `${item.kind}:${item.occurredAt}:${params}`,
    occurredAt: item.occurredAt,
    instant: formatInstant(new Date(item.occurredAt), now),
    line: lineOf(item),
    pay: payOf(item),
  }
}
