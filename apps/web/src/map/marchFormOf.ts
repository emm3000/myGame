import type { FiefOverview, ProvinceMap, ResourceAmounts, Terrain } from '@mygame/contracts'
import { UnitKindSchema } from '@mygame/contracts'
import { copy } from '../copy'
import { formatDuration } from '../design-system/formatDuration'
import type { MarchFormProps } from '../design-system/MarchForm'
import type { PreviewLine } from '../design-system/PreviewLines'
import type { SubmitActionState } from '../design-system/SubmitAction'
import { recruitCountOf } from '../fief/unitCardOf'
import { quantitiesOf } from '../resources/quantitiesOf'
import { atHomeTalliesOf } from './atHomeTalliesOf'
import { carryOf } from './carryOf'
import { isEmptyParty } from './isEmptyParty'
import { oneWaySecondsOf } from './oneWaySecondsOf'
import { type PartyEntries, partyOf } from './partyOf'
import { partyReasonOf } from './partyReasonOf'
import type { UnitCounts } from './unitsAtHomeOf'

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

function lootOf(
  terrain: Terrain,
  party: UnitCounts,
  hours: number,
  fief: FiefOverview,
): ResourceAmounts {
  const rates = { ...fief.forageTerms.yieldPerHour[terrain], gold: 0 }
  const yielded = Object.values(rates).filter((rate) => rate > 0).length
  const heads = UnitKindSchema.options.reduce((total, unit) => total + party[unit], 0)
  const carryShare = Math.floor(carryOf(party, fief) / yielded)
  const carried = (rate: number): number =>
    rate > 0 ? Math.min(heads * rate * hours, carryShare) : 0
  return {
    wood: carried(rates.wood),
    stone: carried(rates.stone),
    iron: carried(rates.iron),
    gold: carried(rates.gold),
    food: carried(rates.food),
  }
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
    { heading: copy.march.roadHeading, value: formatDuration(oneWaySeconds), isNumeral: true },
    {
      heading: copy.march.returnHeading,
      value: formatDuration(2 * oneWaySeconds + hours * secondsPerHour),
      isNumeral: true,
    },
    {
      heading: copy.march.lootHeading,
      value: copy.march.loot(quantitiesOf(loot)),
      isNumeral: false,
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
