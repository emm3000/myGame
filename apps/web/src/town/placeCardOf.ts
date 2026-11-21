import type { BuildingKind } from '@mygame/contracts'
import type { ChromeCatalog, PlayerCopy } from '../copy/PlayerCopy'
import type { CardActionState } from '../design-system/CardAction'
import type { CardCost } from '../design-system/CostList'
import { formatDuration } from '../design-system/formatDuration'
import type { Label } from '../design-system/Label'
import { cardCostsOf } from './cardCostsOf'
import type { LiveTown } from './liveTown'
import { placeNameOf } from './placeNameOf'
import { readyLineOf } from './readyLineOf'
import { shortfallLineOf, shortfallsOf } from './shortfallLineOf'

export interface PlaceCardContent {
  readonly name: Label
  readonly levelLabel: Label
  readonly effect: Label
  readonly costs: ReadonlyArray<CardCost>
  readonly wordsLine: Label | null
  readonly actionLabel: Label
  readonly state: CardActionState
}

type NextLevel = NonNullable<LiveTown['overview']['buildings'][BuildingKind]['nextLevel']>

const heldWordsOf = (
  standing: NonNullable<NextLevel['wordsNeeded']>['standing'],
  { stableWordCount, retainedWordCount }: LiveTown['overview'],
): number => (standing === 'stable' ? stableWordCount : retainedWordCount)

function wordsLineOf(
  copy: PlayerCopy,
  { wordsNeeded }: NextLevel,
  overview: LiveTown['overview'],
): Label | null {
  if (wordsNeeded === null) {
    return null
  }
  const { count, standing } = wordsNeeded
  const held = heldWordsOf(standing, overview)
  return copy.chrome((catalog) => catalog.townWordsNeeded({ standing, needed: count, held }))
}

const isWaitingListFull = ({ work }: LiveTown['overview']): boolean =>
  work.slot !== null && work.waitingList.length >= work.cap

const isShortOfPeople = (nextLevel: NextLevel, { work, people }: LiveTown['overview']): boolean =>
  work.slot === null && work.waitingList.length === 0 && nextLevel.people > people.free

function stateOf(copy: PlayerCopy, nextLevel: NextLevel, town: LiveTown): CardActionState {
  const { overview } = town
  if (isWaitingListFull(overview)) {
    const cap = overview.work.cap
    return {
      kind: 'blocked',
      reason: copy.fixedCopy((catalog) => catalog.refusalWaitingListFull({ cap })),
    }
  }
  if (isShortOfPeople(nextLevel, overview)) {
    const short = { needed: nextLevel.people, free: overview.people.free }
    return { kind: 'blocked', reason: copy.chrome((catalog) => catalog.townPeopleShort(short)) }
  }
  const shortfalls = shortfallsOf(nextLevel.cost, town.stocks)
  return shortfalls.length === 0
    ? { kind: 'affordable' }
    : {
        kind: 'blocked',
        reason: copy.chrome((catalog) => shortfallLineOf(catalog, shortfalls)),
        ready: readyLineOf(copy, nextLevel.cost, town),
      }
}

const isInWork = (place: BuildingKind, { slot, waitingList }: LiveTown): boolean =>
  slot?.building === place || waitingList.some(({ building }) => building === place)

function levelLineOf(catalog: ChromeCatalog, level: number, isWorkedOn: boolean): string {
  if (level === 0) {
    return isWorkedOn ? catalog.townInWork() : catalog.townNotBuilt()
  }
  const levelLine = catalog.townLevel({ level })
  return isWorkedOn ? `${levelLine} · ${catalog.townInWork()}` : levelLine
}

export function placeCardOf(
  copy: PlayerCopy,
  place: BuildingKind,
  town: LiveTown,
): PlaceCardContent {
  const { level, nextLevel } = town.overview.buildings[place]
  const isWorkedOn = isInWork(place, town)
  const common = {
    name: copy.chrome((catalog) => placeNameOf(catalog, place)),
    levelLabel: copy.chrome((catalog) => levelLineOf(catalog, level, isWorkedOn)),
  }
  if (nextLevel === null) {
    const topLevel = copy.chrome((catalog) => catalog.townTopLevel())
    return {
      ...common,
      effect: copy.chrome((catalog) => catalog.townAtTopLevel()),
      costs: [],
      wordsLine: null,
      actionLabel: topLevel,
      state: { kind: 'atMaxLevel', label: topLevel },
    }
  }
  const duration = formatDuration(nextLevel.durationSeconds)
  return {
    ...common,
    effect: copy.chrome((catalog) => catalog.townPeopleAtWork({ people: nextLevel.people })),
    costs: cardCostsOf(copy, nextLevel.cost, town.stocks),
    wordsLine: wordsLineOf(copy, nextLevel, town.overview),
    actionLabel: copy.chrome(
      (catalog) => `${catalog.townBuild({ level: nextLevel.level })} · ${duration}`,
    ),
    state: stateOf(copy, nextLevel, town),
  }
}
