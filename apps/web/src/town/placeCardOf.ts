import {
  refusalWaitingListFull,
  townAmount,
  townAtTopLevel,
  townBuild,
  townCostName,
  townLevel,
  townPeopleAtWork,
  townPeopleShort,
  townShortfall,
  townShortMark,
  townTopLevel,
} from '@mygame/catalog'
import {
  type BuildingKind,
  type ResourceAmounts,
  type ResourceKind,
  ResourceKindSchema,
} from '@mygame/contracts/town'
import type { BuildingCardProps } from '../design-system/BuildingCard'
import type { CardActionState } from '../design-system/CardAction'
import type { CardCost } from '../design-system/CostList'
import { conjunctionOf } from '../design-system/conjunctionOf'
import { formatQuantity } from '../design-system/formatQuantity'
import { townResourceNameOf } from '../resources/townResourceNameOf'
import type { LiveStocks, LiveTown } from './liveTown'
import { placeNameOf } from './placeNameOf'

export type PlaceCardContent = Omit<
  BuildingCardProps,
  'titleElement' | 'isWaiting' | 'onUpgrade' | 'art' | 'actionTone'
>

type NextLevel = NonNullable<LiveTown['overview']['buildings'][BuildingKind]['nextLevel']>

interface Shortfall {
  readonly resource: ResourceKind
  readonly amount: number
}

const shortfallsOf = (cost: ResourceAmounts, stocks: LiveStocks): ReadonlyArray<Shortfall> =>
  ResourceKindSchema.options
    .map((resource) => ({
      resource,
      amount: Math.max(0, cost[resource] - Math.floor(stocks[resource])),
    }))
    .filter(({ amount }) => amount > 0)

const costsOf = (cost: ResourceAmounts, stocks: LiveStocks): ReadonlyArray<CardCost> =>
  ResourceKindSchema.options
    .filter((resource) => cost[resource] > 0)
    .map((resource) => ({
      kind: resource,
      amount: cost[resource],
      spokenName: townCostName({ resource: townResourceNameOf(resource) }),
      shortMark: cost[resource] > Math.floor(stocks[resource]) ? townShortMark() : undefined,
    }))

const shortfallLineOf = (shortfalls: ReadonlyArray<Shortfall>): string =>
  townShortfall({
    missing: conjunctionOf(
      shortfalls.map(({ resource, amount }) =>
        townAmount({ amount: formatQuantity(amount), resource: townResourceNameOf(resource) }),
      ),
    ),
  })

const isWaitingListFull = ({ work }: LiveTown['overview']): boolean =>
  work.slot !== null && work.waitingList.length >= work.cap

const isShortOfPeople = (nextLevel: NextLevel, { work, people }: LiveTown['overview']): boolean =>
  work.slot === null && work.waitingList.length === 0 && nextLevel.people > people.free

function stateOf(nextLevel: NextLevel, town: LiveTown): CardActionState {
  const { overview } = town
  if (isWaitingListFull(overview)) {
    return { kind: 'blocked', reason: refusalWaitingListFull({ cap: overview.work.cap }) }
  }
  if (isShortOfPeople(nextLevel, overview)) {
    return {
      kind: 'blocked',
      reason: townPeopleShort({ needed: nextLevel.people, free: overview.people.free }),
    }
  }
  const shortfalls = shortfallsOf(nextLevel.cost, town.stocks)
  if (shortfalls.length > 0) {
    return { kind: 'blocked', reason: shortfallLineOf(shortfalls) }
  }
  return { kind: 'affordable' }
}

export function placeCardOf(place: BuildingKind, town: LiveTown): PlaceCardContent {
  const { level, nextLevel } = town.overview.buildings[place]
  const common = {
    name: placeNameOf(place),
    levelLabel: townLevel({ level }),
  }
  if (nextLevel === null) {
    return {
      ...common,
      effect: townAtTopLevel(),
      costs: [],
      actionLabel: townTopLevel(),
      durationSeconds: 0,
      state: { kind: 'atMaxLevel', label: townTopLevel() },
    }
  }
  return {
    ...common,
    effect: townPeopleAtWork({ people: nextLevel.people }),
    costs: costsOf(nextLevel.cost, town.stocks),
    actionLabel: townBuild({ level: nextLevel.level }),
    durationSeconds: nextLevel.durationSeconds,
    state: stateOf(nextLevel, town),
  }
}
