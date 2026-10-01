import type {
  FiefOverview,
  ProvinceMap,
  ResourceAmounts,
  ResourceKind,
  Terrain,
} from '@mygame/contracts'
import { ResourceKindSchema, UnitKindSchema } from '@mygame/contracts'
import { copy } from '../copy'
import { formatDuration } from '../design-system/formatDuration'
import type { MarchFormProps } from '../design-system/MarchForm'
import type { PreviewLine } from '../design-system/PreviewLines'
import type { SeasonMarkProps } from '../design-system/SeasonMark'
import type { SubmitActionState } from '../design-system/SubmitAction'
import { recruitCountOf } from '../fief/unitCardOf'
import { quantitiesOf } from '../resources/quantitiesOf'
import type { UnitCounts } from '../units/UnitCounts'
import { atHomeTalliesOf } from './atHomeTalliesOf'
import { carryOf } from './carryOf'
import { isEmptyParty } from './isEmptyParty'
import { oneWaySecondsOf } from './oneWaySecondsOf'
import { type PartyEntries, partyOf } from './partyOf'
import { partyReasonOf } from './partyReasonOf'
import { roadMarksOf } from './roadMarksOf'

export type PlotCamp = NonNullable<ProvinceMap['plots'][number]['camp']>

export interface MarchTarget {
  readonly province: number
  readonly plot: number
  readonly terrain: Terrain
  readonly camp: PlotCamp | null
}

export interface MarchEntries {
  readonly units: PartyEntries
  readonly hours: string
}

export type MarchFormContent = Pick<
  MarchFormProps,
  'title' | 'artSrc' | 'atHome' | 'isFieldDisabled' | 'preview' | 'actionLabel' | 'state'
>

const secondsPerHour = 3600

const neutralPercent = 100

const yieldRatesOf = (terrain: Terrain, fief: FiefOverview): ResourceAmounts => ({
  ...fief.forageTerms.yieldPerHour[terrain],
  gold: 0,
})

const lootPercentOf = (resource: ResourceKind, fief: FiefOverview): number =>
  fief.season === null ? neutralPercent : fief.season.multiplierPercent[resource]

function lootOf(
  terrain: Terrain,
  party: UnitCounts,
  hours: number,
  fief: FiefOverview,
): ResourceAmounts {
  const rates = yieldRatesOf(terrain, fief)
  const yielded = Object.values(rates).filter((rate) => rate > 0).length
  const heads = UnitKindSchema.options.reduce((total, unit) => total + party[unit], 0)
  const carryShare = Math.floor(carryOf(party, fief) / yielded)
  const carried = (resource: ResourceKind): number =>
    rates[resource] > 0
      ? Math.min(
          Math.floor(
            (heads * rates[resource] * hours * lootPercentOf(resource, fief)) / neutralPercent,
          ),
          carryShare,
        )
      : 0
  return {
    wood: carried('wood'),
    stone: carried('stone'),
    iron: carried('iron'),
    gold: carried('gold'),
    food: carried('food'),
  }
}

function lootMarksOf(terrain: Terrain, fief: FiefOverview): ReadonlyArray<SeasonMarkProps> {
  const { season } = fief
  if (season === null) {
    return []
  }
  const rates = yieldRatesOf(terrain, fief)
  return ResourceKindSchema.options
    .filter(
      (resource) => rates[resource] > 0 && season.multiplierPercent[resource] !== neutralPercent,
    )
    .map((resource) => ({
      season: season.kind,
      words: copy.fief.seasonMark(season.kind, resource, season.multiplierPercent[resource]),
    }))
}

function hoursOf(entry: string, maxStayHours: number): number | undefined {
  const hours = recruitCountOf(entry)
  return hours !== undefined && hours <= maxStayHours ? hours : undefined
}

function previewOf(
  target: MarchTarget,
  party: UnitCounts,
  hours: number,
  fief: FiefOverview,
): ReadonlyArray<PreviewLine> {
  const oneWaySeconds = oneWaySecondsOf(target, party, fief)
  const loot = lootOf(target.terrain, party, hours, fief)
  return [
    {
      heading: copy.march.roadHeading,
      value: formatDuration(oneWaySeconds),
      isNumeral: true,
      marks: roadMarksOf(fief),
    },
    {
      heading: copy.march.returnHeading,
      value: formatDuration(2 * oneWaySeconds + hours * secondsPerHour),
      isNumeral: true,
    },
    {
      heading: copy.march.lootHeading,
      value: copy.march.loot(quantitiesOf(loot)),
      isNumeral: false,
      marks: lootMarksOf(target.terrain, fief),
    },
  ]
}

function stateOf(
  party: UnitCounts | undefined,
  hours: number | undefined,
  fief: FiefOverview,
): SubmitActionState {
  if (fief.march !== null) {
    return { kind: 'blocked', reason: copy.march.marchAway }
  }
  if (party === undefined) {
    return { kind: 'blocked', reason: copy.march.invalidCount }
  }
  if (hours === undefined) {
    return { kind: 'blocked', reason: copy.march.invalidHours(fief.forageTerms.maxStayHours) }
  }
  const reason = partyReasonOf(party, fief)
  return reason === undefined ? { kind: 'affordable' } : { kind: 'blocked', reason }
}

export function marchFormOf(
  target: MarchTarget,
  entries: MarchEntries,
  fief: FiefOverview,
): MarchFormContent {
  const party = partyOf(entries.units)
  const hours = hoursOf(entries.hours, fief.forageTerms.maxStayHours)
  return {
    title: copy.march.title(target.province, target.plot),
    atHome: atHomeTalliesOf(fief),
    isFieldDisabled: fief.march !== null,
    preview:
      party === undefined || hours === undefined || isEmptyParty(party)
        ? undefined
        : previewOf(target, party, hours, fief),
    actionLabel: copy.march.send,
    state: stateOf(party, hours, fief),
  }
}
