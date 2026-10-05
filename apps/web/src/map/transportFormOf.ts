import type { FiefOverview, ResourceAmounts } from '@mygame/contracts'
import { copy } from '../copy'
import { convoyArtOf } from '../design-system/convoyArtOf'
import { formatDuration } from '../design-system/formatDuration'
import type { PreviewLine } from '../design-system/PreviewLines'
import type { SubmitActionState } from '../design-system/SubmitAction'
import { shortfallsOf } from '../fief/shortfallsOf'
import type { UnitCounts } from '../units/UnitCounts'
import { atHomeTalliesOf } from './atHomeTalliesOf'
import { type CargoEntries, cargoOf } from './cargoOf'
import { carryOf } from './carryOf'
import { isEmptyParty } from './isEmptyParty'
import type { MarchFormContent } from './marchFormOf'
import { oneWaySecondsOf, type RoadEnd } from './oneWaySecondsOf'
import { type PartyEntries, partyOf } from './partyOf'
import { partyReasonOf } from './partyReasonOf'
import { roadMarksOf } from './roadMarksOf'

export interface TransportEntries {
  readonly units: PartyEntries
  readonly cargo: CargoEntries
}

const cargoTotalOf = (cargo: ResourceAmounts): number =>
  cargo.wood + cargo.stone + cargo.iron + cargo.gold + cargo.food

const stocksOf = ({ resources }: FiefOverview): ResourceAmounts => ({
  wood: resources.wood.amount,
  stone: resources.stone.amount,
  iron: resources.iron.amount,
  gold: resources.gold.amount,
  food: resources.food.amount,
})

function previewOf(
  target: RoadEnd,
  party: UnitCounts,
  cargo: ResourceAmounts,
  fief: FiefOverview,
): ReadonlyArray<PreviewLine> {
  const carryLine: PreviewLine = {
    heading: copy.transport.cargoHeading,
    value: copy.transport.carry(cargoTotalOf(cargo), carryOf(party, fief)),
    isNumeral: true,
  }
  if (isEmptyParty(party)) {
    return [carryLine]
  }
  const oneWay = formatDuration(oneWaySecondsOf(target, party, fief))
  return [
    carryLine,
    { heading: copy.march.roadHeading, value: oneWay, isNumeral: true, marks: roadMarksOf(fief) },
    { heading: copy.founding.arrivalHeading, value: oneWay, isNumeral: true },
  ]
}

function cargoReasonOf(
  party: UnitCounts,
  cargo: ResourceAmounts,
  fief: FiefOverview,
): string | undefined {
  const total = cargoTotalOf(cargo)
  if (total === 0) {
    return copy.transport.emptyCargo
  }
  const carry = carryOf(party, fief)
  if (total > carry) {
    return copy.transport.cargoAboveCarry(total, carry)
  }
  const shortfalls = shortfallsOf(cargo, stocksOf(fief))
  return shortfalls.length === 0 ? undefined : copy.fief.tooExpensive(shortfalls)
}

function stateOf(
  party: UnitCounts | undefined,
  cargo: ResourceAmounts | undefined,
  fief: FiefOverview,
): SubmitActionState {
  if (fief.march !== null) {
    return { kind: 'blocked', reason: copy.march.marchAway }
  }
  if (party === undefined || cargo === undefined) {
    return { kind: 'blocked', reason: copy.march.invalidCount }
  }
  const reason = partyReasonOf(party, fief) ?? cargoReasonOf(party, cargo, fief)
  return reason === undefined ? { kind: 'affordable' } : { kind: 'blocked', reason }
}

export function transportFormOf(
  target: RoadEnd,
  entries: TransportEntries,
  fief: FiefOverview,
): MarchFormContent {
  const party = partyOf(entries.units)
  const cargo = cargoOf(entries.cargo)
  return {
    title: copy.transport.title(target.province, target.plot),
    artSrc: convoyArtOf(),
    atHome: atHomeTalliesOf(fief),
    isFieldDisabled: fief.march !== null,
    preview:
      party === undefined || cargo === undefined
        ? undefined
        : previewOf(target, party, cargo, fief),
    actionLabel: copy.transport.send,
    state: stateOf(party, cargo, fief),
  }
}
