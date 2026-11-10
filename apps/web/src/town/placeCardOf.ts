import {
  refusalWaitingListFull,
  townAtTopLevel,
  townBuild,
  townInWork,
  townLevel,
  townNotBuilt,
  townPeopleAtWork,
  townPeopleShort,
  townTopLevel,
} from '@mygame/catalog'
import type { BuildingKind } from '@mygame/contracts'
import type { CardActionState } from '../design-system/CardAction'
import type { CardCost } from '../design-system/CostList'
import { cardCostsOf } from './cardCostsOf'
import type { LiveTown } from './liveTown'
import { placeNameOf } from './placeNameOf'
import { shortfallLineOf } from './shortfallLineOf'

export interface PlaceCardContent {
  readonly name: string
  readonly levelLabel: string
  readonly effect: string
  readonly costs: ReadonlyArray<CardCost>
  readonly actionLabel: string
  readonly durationSeconds: number
  readonly state: CardActionState
}

type NextLevel = NonNullable<LiveTown['overview']['buildings'][BuildingKind]['nextLevel']>

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
  const shortfall = shortfallLineOf(nextLevel.cost, town.stocks)
  return shortfall === undefined ? { kind: 'affordable' } : { kind: 'blocked', reason: shortfall }
}

const isInWork = (place: BuildingKind, { slot, waitingList }: LiveTown): boolean =>
  slot?.building === place || waitingList.some(({ building }) => building === place)

function levelLabelOf(place: BuildingKind, level: number, town: LiveTown): string {
  if (level === 0) {
    return isInWork(place, town) ? townInWork() : townNotBuilt()
  }
  return isInWork(place, town) ? `${townLevel({ level })} · ${townInWork()}` : townLevel({ level })
}

export function placeCardOf(place: BuildingKind, town: LiveTown): PlaceCardContent {
  const { level, nextLevel } = town.overview.buildings[place]
  const common = {
    name: placeNameOf(place),
    levelLabel: levelLabelOf(place, level, town),
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
    costs: cardCostsOf(nextLevel.cost, town.stocks),
    actionLabel: townBuild({ level: nextLevel.level }),
    durationSeconds: nextLevel.durationSeconds,
    state: stateOf(nextLevel, town),
  }
}
