import {
  townOfficeBusy,
  townOfficeCountNeeded,
  townOfficeNeedsLevel,
  townOfficePeopleName,
  townPeopleShort,
  townShortMark,
} from '@mygame/catalog'
import type { HireKind, ResourceAmounts } from '@mygame/contracts'
import type { OrderActionState } from '../design-system/CardAction'
import type { CardCost } from '../design-system/CostList'
import { formatDuration } from '../design-system/formatDuration'
import { cardCostsOf } from './cardCostsOf'
import { hireWordsOf } from './hireWordsOf'
import type { LiveTown } from './liveTown'
import { shortfallLineOf } from './shortfallLineOf'

interface HireCardHeader {
  readonly hire: HireKind
  readonly name: string
  readonly teamLine: string
  readonly requirement: string
}

export type HireCardContent =
  | (HireCardHeader & { readonly kind: 'locked' })
  | (HireCardHeader & {
      readonly kind: 'open'
      readonly fieldLabel: string
      readonly isFieldDisabled: boolean
      readonly costs: ReadonlyArray<CardCost>
      readonly actionLabel: string
      readonly state: OrderActionState
    })

type HireTerms = LiveTown['overview']['hiring']['terms'][HireKind]

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

const freePeopleOf = ({ overview }: LiveTown): number | undefined =>
  overview.work.slot === null && overview.work.waitingList.length === 0
    ? overview.people.free
    : undefined

function stateOf(terms: HireTerms, count: number | undefined, town: LiveTown): OrderActionState {
  if (town.overview.hiring.order !== null) {
    return { kind: 'blocked', reason: townOfficeBusy() }
  }
  if (count === undefined) {
    return { kind: 'blocked', reason: townOfficeCountNeeded() }
  }
  const needed = terms.people * count
  const free = freePeopleOf(town)
  if (free !== undefined && needed > free) {
    return { kind: 'blocked', reason: townPeopleShort({ needed, free }) }
  }
  const shortfall = shortfallLineOf(costTimes(terms.cost, count), town.stocks)
  return shortfall === undefined ? { kind: 'affordable' } : { kind: 'blocked', reason: shortfall }
}

function costsOf(
  terms: HireTerms,
  count: number | undefined,
  town: LiveTown,
): ReadonlyArray<CardCost> {
  if (count === undefined) {
    return []
  }
  const needed = terms.people * count
  const free = freePeopleOf(town)
  return [
    ...cardCostsOf(costTimes(terms.cost, count), town.stocks),
    {
      kind: 'people',
      amount: needed,
      spokenName: townOfficePeopleName({ count: needed }),
      shortMark: free !== undefined && needed > free ? townShortMark() : undefined,
    },
  ]
}

export function hireCardOf(hire: HireKind, entry: string, town: LiveTown): HireCardContent {
  const { hiring, buildings } = town.overview
  const terms = hiring.terms[hire]
  const words = hireWordsOf(hire)
  const header = {
    hire,
    name: words.name(),
    teamLine: words.team({ count: hiring.hires[hire] }),
    requirement: townOfficeNeedsLevel({ level: terms.requiredOfficeLevel }),
  }
  if (buildings.office.level < terms.requiredOfficeLevel) {
    return { ...header, kind: 'locked' }
  }
  const count = hireCountOf(entry)
  return {
    ...header,
    kind: 'open',
    fieldLabel: words.fieldLabel(),
    isFieldDisabled: hiring.order !== null,
    costs: costsOf(terms, count, town),
    actionLabel:
      count === undefined
        ? words.hireAny()
        : `${words.hire({ count })} · ${formatDuration(count * terms.secondsPerHire)}`,
    state: stateOf(terms, count, town),
  }
}
