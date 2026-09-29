import type { FiefOverview, ProvinceMap, ResourceAmounts, Terrain } from '@mygame/contracts'
import { copy } from '../copy'
import { formatDuration } from '../design-system/formatDuration'
import type { MarchFormProps } from '../design-system/MarchForm'
import type { PreviewLine } from '../design-system/PreviewLines'
import type { SubmitActionState } from '../design-system/SubmitAction'
import { recruitCountOf } from '../fief/unitCardOf'
import { quantitiesOf } from '../resources/quantitiesOf'
import { infantryAtHomeOf } from './infantryAtHomeOf'
import { oneWaySecondsOf } from './oneWaySecondsOf'

export type PlotCamp = NonNullable<ProvinceMap['plots'][number]['camp']>

export interface MarchTarget {
  readonly province: number
  readonly plot: number
  readonly terrain: Terrain
  readonly camp: PlotCamp | null
}

export interface MarchEntries {
  readonly infantry: string
  readonly hours: string
}

export type MarchFormContent = Pick<
  MarchFormProps,
  'title' | 'count' | 'countLabel' | 'isFieldDisabled' | 'preview' | 'actionLabel' | 'state'
>

const secondsPerHour = 3600

function lootOf(
  terrain: Terrain,
  infantry: number,
  hours: number,
  fief: FiefOverview,
): ResourceAmounts {
  const { carryPerInfantry, yieldPerHour } = fief.forageTerms
  const rates = { ...yieldPerHour[terrain], gold: 0 }
  const yielded = Object.values(rates).filter((rate) => rate > 0).length
  const carried = (rate: number): number =>
    rate > 0
      ? Math.min(infantry * rate * hours, Math.floor((carryPerInfantry * infantry) / yielded))
      : 0
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
  infantry: number,
  hours: number,
  fief: FiefOverview,
): ReadonlyArray<PreviewLine> {
  const oneWaySeconds = oneWaySecondsOf(target, fief)
  const loot = lootOf(target.terrain, infantry, hours, fief)
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
  infantry: number | undefined,
  hours: number | undefined,
  fief: FiefOverview,
): SubmitActionState {
  if (fief.march !== null) {
    return { kind: 'blocked', reason: copy.march.marchAway }
  }
  if (infantry === undefined) {
    return { kind: 'blocked', reason: copy.march.invalidInfantry }
  }
  if (hours === undefined) {
    return { kind: 'blocked', reason: copy.march.invalidHours(fief.forageTerms.maxStayHours) }
  }
  const atHome = infantryAtHomeOf(fief)
  if (infantry > atHome) {
    return { kind: 'blocked', reason: copy.march.notEnoughAtHome(infantry, atHome) }
  }
  return { kind: 'affordable' }
}

export function marchFormOf(
  target: MarchTarget,
  entries: MarchEntries,
  fief: FiefOverview,
): MarchFormContent {
  const infantry = recruitCountOf(entries.infantry)
  const hours = hoursOf(entries.hours, fief.forageTerms.maxStayHours)
  const atHome = infantryAtHomeOf(fief)
  return {
    title: copy.march.title(target.province, target.plot),
    count: atHome,
    countLabel: copy.march.atHome(atHome),
    isFieldDisabled: fief.march !== null,
    preview:
      infantry === undefined || hours === undefined
        ? undefined
        : previewOf(target, infantry, hours, fief),
    actionLabel: copy.march.send,
    state: stateOf(infantry, hours, fief),
  }
}
