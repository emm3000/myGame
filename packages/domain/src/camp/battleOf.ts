import { byUnitKind } from '../fief/byUnitKind'
import type { UnitCountsByKind } from '../fief/FiefUnitCounts'
import { unitKinds } from '../fief/unitKinds'
import type { FiefSettings } from '../ports/BuildingCatalog'

export type Battle = {
  readonly won: boolean
  readonly unitsLost: UnitCountsByKind
  readonly campLost: number
  readonly survivors: UnitCountsByKind
}

type UnitTerms = FiefSettings['units']

type LossTally = {
  readonly rest: number
  readonly lost: UnitCountsByKind
}

const strengthOf = (units: UnitCountsByKind, terms: UnitTerms): number =>
  unitKinds.reduce((strength, unit) => strength + units[unit] * terms[unit].strength, 0)

const tallyLosses = (units: UnitCountsByKind, lostStrength: number, terms: UnitTerms): LossTally =>
  unitKinds.reduce<LossTally>(
    ({ rest, lost }, unit) => {
      const unitsLost = Math.min(units[unit], Math.ceil(rest / terms[unit].strength))
      return {
        rest: Math.max(0, rest - unitsLost * terms[unit].strength),
        lost: { ...lost, [unit]: unitsLost },
      }
    },
    { rest: lostStrength, lost: byUnitKind(() => 0) },
  )

const sparingTheLastReached = (
  units: UnitCountsByKind,
  lost: UnitCountsByKind,
): UnitCountsByKind => {
  const everyUnitLost = unitKinds.every((unit) => lost[unit] === units[unit])
  const lastReached = unitKinds.findLast((unit) => lost[unit] > 0)
  if (!everyUnitLost || lastReached === undefined) {
    return lost
  }
  return { ...lost, [lastReached]: lost[lastReached] - 1 }
}

const winnersLossesOf = (
  units: UnitCountsByKind,
  lostStrength: number,
  terms: UnitTerms,
): UnitCountsByKind => {
  const { lost } = tallyLosses(units, lostStrength, terms)
  return sparingTheLastReached(units, lost)
}

export const battleOf = (
  units: UnitCountsByKind,
  campStrength: number,
  terms: UnitTerms,
): Battle => {
  const ownStrength = strengthOf(units, terms)
  if (ownStrength > campStrength) {
    const unitsLost = winnersLossesOf(
      units,
      Math.ceil((campStrength * campStrength) / ownStrength),
      terms,
    )
    return {
      won: true,
      unitsLost,
      campLost: campStrength,
      survivors: byUnitKind((unit) => units[unit] - unitsLost[unit]),
    }
  }
  const campLost = Math.min(campStrength - 1, Math.ceil((ownStrength * ownStrength) / campStrength))
  return { won: false, unitsLost: units, campLost, survivors: byUnitKind(() => 0) }
}
