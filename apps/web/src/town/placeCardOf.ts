import type { BuildingKind } from '@mygame/contracts'
import { chromeWithFiguresOf } from '../copy/chromeWithFiguresOf'
import type { ChromeCatalog, PlayerCopy } from '../copy/PlayerCopy'
import type { CardActionState } from '../design-system/CardAction'
import type { CardCost } from '../design-system/CostList'
import { formatDuration } from '../design-system/formatDuration'
import type { Label } from '../design-system/Label'
import { cardCostsOf } from './cardCostsOf'
import type { LiveTown } from './liveTown'
import { placeNameOf } from './placeNameOf'
import { readyLineOf, readySecondsOf } from './readyLineOf'
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
  return chromeWithFiguresOf(copy, (catalog, figure) =>
    catalog.townWordsNeeded({
      standing,
      needed: figure(String(count)),
      held: figure(String(held)),
    }),
  )
}

const isWaitingListFull = ({ work }: LiveTown['overview']): boolean =>
  work.slot !== null && work.waitingList.length >= work.cap

const isShortOfPeople = (nextLevel: NextLevel, { work, people }: LiveTown['overview']): boolean =>
  work.slot === null && work.waitingList.length === 0 && nextLevel.people > people.free

type PlaceBlock = 'waitingListFull' | 'peopleShort' | 'resources'

function placeBlockOf(nextLevel: NextLevel, town: LiveTown): PlaceBlock | null {
  if (isWaitingListFull(town.overview)) {
    return 'waitingListFull'
  }
  if (isShortOfPeople(nextLevel, town.overview)) {
    return 'peopleShort'
  }
  return shortfallsOf(nextLevel.cost, town.stocks).length === 0 ? null : 'resources'
}

function stateOf(copy: PlayerCopy, nextLevel: NextLevel, town: LiveTown): CardActionState {
  const { overview } = town
  switch (placeBlockOf(nextLevel, town)) {
    case 'waitingListFull': {
      const cap = overview.work.cap
      return {
        kind: 'blocked',
        reason: copy.fixedCopy((catalog) => catalog.refusalWaitingListFull({ cap })),
      }
    }
    case 'peopleShort': {
      const short = { needed: nextLevel.people, free: overview.people.free }
      return { kind: 'blocked', reason: copy.chrome((catalog) => catalog.townPeopleShort(short)) }
    }
    case 'resources': {
      const shortfalls = shortfallsOf(nextLevel.cost, town.stocks)
      return {
        kind: 'blocked',
        reason: copy.chrome((catalog) => shortfallLineOf(catalog, shortfalls)),
        ready: readyLineOf(copy, nextLevel.cost, town),
      }
    }
    case null:
      return { kind: 'affordable' }
  }
}

export function placeReadySecondsOf(place: BuildingKind, town: LiveTown): number | null {
  const { nextLevel } = town.overview.buildings[place]
  return nextLevel !== null && placeBlockOf(nextLevel, town) === 'resources'
    ? readySecondsOf(nextLevel.cost, town)
    : null
}

const isInWork = (place: BuildingKind, { slot, waitingList }: LiveTown): boolean =>
  slot?.building === place || waitingList.some(({ building }) => building === place)

function levelLineOf(
  catalog: ChromeCatalog,
  figure: (text: string) => string,
  level: number,
  isWorkedOn: boolean,
): string {
  if (level === 0) {
    return isWorkedOn ? catalog.townInWork() : catalog.townNotBuilt()
  }
  const levelLine = catalog.townLevel({ level: figure(String(level)) })
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
    levelLabel: chromeWithFiguresOf(copy, (catalog, figure) =>
      levelLineOf(catalog, figure, level, isWorkedOn),
    ),
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
    effect: chromeWithFiguresOf(copy, (catalog, figure) =>
      catalog.townPeopleAtWork({ people: figure(String(nextLevel.people)) }),
    ),
    costs: cardCostsOf(copy, nextLevel.cost, town.stocks),
    wordsLine: wordsLineOf(copy, nextLevel, town.overview),
    actionLabel: copy.chrome(
      (catalog) => `${catalog.townBuild({ level: nextLevel.level })} · ${duration}`,
    ),
    state: stateOf(copy, nextLevel, town),
  }
}
