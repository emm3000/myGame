import type { HireKind, ResourceAmounts } from '@mygame/contracts'
import type { PlayerCopy } from '../copy/PlayerCopy'
import type { OrderActionState } from '../design-system/CardAction'
import type { CardCost } from '../design-system/CostList'
import { formatDuration } from '../design-system/formatDuration'
import type { Label } from '../design-system/Label'
import { cardCostsOf } from './cardCostsOf'
import { hireWordsOf } from './hireWordsOf'
import type { LiveTown } from './liveTown'
import { readyLineOf, readySecondsOf } from './readyLineOf'
import { shortfallLineOf, shortfallsOf } from './shortfallLineOf'

interface HireCardHeader {
  readonly hire: HireKind
  readonly name: Label
  readonly teamLine: Label
  readonly requirement: Label
}

export type HireCardContent =
  | (HireCardHeader & { readonly kind: 'locked' })
  | (HireCardHeader & {
      readonly kind: 'open'
      readonly fieldLabel: Label
      readonly isFieldDisabled: boolean
      readonly costs: ReadonlyArray<CardCost>
      readonly actionLabel: Label
      readonly state: OrderActionState
    })

type HireTerms = LiveTown['overview']['hiring']['terms'][HireKind]

interface HireOrder {
  readonly terms: HireTerms
  readonly count: number | undefined
  readonly town: LiveTown
}

export type HireEntries = Readonly<Record<HireKind, string>>

export const firstHireEntries: HireEntries = { worker: '1', truck: '1' }

const wholeCountPattern = /^[0-9]+$/

export function hireCountOf(entry: string): number | undefined {
  if (!wholeCountPattern.test(entry)) {
    return undefined
  }
  const count = Number(entry)
  return count >= 1 ? count : undefined
}

const costTimes = (cost: ResourceAmounts, count: number): ResourceAmounts => ({
  money: cost.money * count,
  food: cost.food * count,
  power: cost.power * count,
  material: cost.material * count,
})

const isLocked = (terms: HireTerms, { overview }: LiveTown): boolean =>
  overview.buildings.office.level < terms.requiredOfficeLevel

const freePeopleOf = ({ overview }: LiveTown): number | undefined =>
  overview.work.slot === null && overview.work.waitingList.length === 0
    ? overview.people.free
    : undefined

type HireBlock = 'busy' | 'peopleShort' | 'resources'

interface CountedOrder {
  readonly terms: HireTerms
  readonly count: number
  readonly town: LiveTown
}

function hireBlockOf({ terms, count, town }: CountedOrder): HireBlock | null {
  if (town.overview.hiring.order !== null) {
    return 'busy'
  }
  const free = freePeopleOf(town)
  if (free !== undefined && terms.people * count > free) {
    return 'peopleShort'
  }
  return shortfallsOf(costTimes(terms.cost, count), town.stocks).length === 0 ? null : 'resources'
}

function countedStateOf(copy: PlayerCopy, order: CountedOrder): OrderActionState {
  const { terms, count, town } = order
  switch (hireBlockOf(order)) {
    case 'busy':
      return { kind: 'blocked', reason: copy.chrome((catalog) => catalog.townOfficeBusy()) }
    case 'peopleShort': {
      const short = { needed: terms.people * count, free: town.overview.people.free }
      return { kind: 'blocked', reason: copy.chrome((catalog) => catalog.townPeopleShort(short)) }
    }
    case 'resources': {
      const cost = costTimes(terms.cost, count)
      const shortfalls = shortfallsOf(cost, town.stocks)
      return {
        kind: 'blocked',
        reason: copy.chrome((catalog) => shortfallLineOf(catalog, shortfalls)),
        ready: readyLineOf(copy, cost, town),
      }
    }
    case null:
      return { kind: 'affordable' }
  }
}

function stateOf(copy: PlayerCopy, { terms, count, town }: HireOrder): OrderActionState {
  return count === undefined
    ? { kind: 'invalidEntry', reason: copy.chrome((catalog) => catalog.townOfficeCountNeeded()) }
    : countedStateOf(copy, { terms, count, town })
}

function costsOf(copy: PlayerCopy, { terms, count, town }: HireOrder): ReadonlyArray<CardCost> {
  if (count === undefined) {
    return []
  }
  const needed = terms.people * count
  const free = freePeopleOf(town)
  return [
    ...cardCostsOf(copy, costTimes(terms.cost, count), town.stocks),
    {
      kind: 'people',
      amount: needed,
      spokenName: copy.chrome((catalog) => catalog.townOfficePeopleName({ count: needed })),
      shortMark:
        free !== undefined && needed > free
          ? copy.chrome((catalog) => catalog.townShortMark())
          : undefined,
    },
  ]
}

export function hireCardOf(
  copy: PlayerCopy,
  hire: HireKind,
  entry: string,
  town: LiveTown,
): HireCardContent {
  const { hiring } = town.overview
  const terms = hiring.terms[hire]
  const words = hireWordsOf(hire)
  const header = {
    hire,
    name: copy.chrome(words.name),
    teamLine: copy.chrome((catalog) => words.team(catalog, { count: hiring.hires[hire] })),
    requirement: copy.chrome((catalog) =>
      catalog.townOfficeNeedsLevel({ level: terms.requiredOfficeLevel }),
    ),
  }
  if (isLocked(terms, town)) {
    return { ...header, kind: 'locked' }
  }
  const count = hireCountOf(entry)
  const order = { terms, count, town }
  return {
    ...header,
    kind: 'open',
    fieldLabel: copy.chrome(words.fieldLabel),
    isFieldDisabled: hiring.order !== null,
    costs: costsOf(copy, order),
    actionLabel: copy.chrome((catalog) =>
      count === undefined
        ? words.hireAny(catalog)
        : `${words.hire(catalog, { count })} · ${formatDuration(count * terms.secondsPerHire)}`,
    ),
    state: stateOf(copy, order),
  }
}

export function hireReadySecondsOf(hire: HireKind, entry: string, town: LiveTown): number | null {
  const terms = town.overview.hiring.terms[hire]
  const count = hireCountOf(entry)
  if (isLocked(terms, town) || count === undefined) {
    return null
  }
  return hireBlockOf({ terms, count, town }) === 'resources'
    ? readySecondsOf(costTimes(terms.cost, count), town)
    : null
}
