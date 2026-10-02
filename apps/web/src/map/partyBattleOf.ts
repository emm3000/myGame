import type { FiefOverview } from '@mygame/contracts'
import { partyKinds } from '../units/partyKinds'
import type { UnitCounts } from '../units/UnitCounts'
import { byUnitKind } from './byUnitKind'

export interface PartyBattle {
  readonly isWon: boolean
  readonly unitsLost: UnitCounts
  readonly campLost: number
  readonly survivors: UnitCounts
}

interface LossTally {
  readonly rest: number
  readonly lost: UnitCounts
}

const strengthOf = (party: UnitCounts, fief: FiefOverview): number =>
  partyKinds.reduce((strength, unit) => strength + party[unit] * fief.unitTerms[unit].strength, 0)

const tallyLosses = (party: UnitCounts, lostStrength: number, fief: FiefOverview): UnitCounts =>
  partyKinds.reduce<LossTally>(
    (tally, unit) => {
      const { strength } = fief.unitTerms[unit]
      if (party[unit] === 0 || strength === 0) {
        return tally
      }
      const { rest, lost } = tally
      const unitsLost = Math.min(party[unit], Math.ceil(rest / strength))
      return {
        rest: Math.max(0, rest - unitsLost * strength),
        lost: { ...lost, [unit]: unitsLost },
      }
    },
    { rest: lostStrength, lost: byUnitKind(() => 0) },
  ).lost

const sparingTheLastReached = (party: UnitCounts, lost: UnitCounts): UnitCounts => {
  const isEveryUnitLost = partyKinds.every((unit) => lost[unit] === party[unit])
  const lastReached = partyKinds.findLast((unit) => lost[unit] > 0)
  if (!isEveryUnitLost || lastReached === undefined) {
    return lost
  }
  return { ...lost, [lastReached]: lost[lastReached] - 1 }
}

export function partyBattleOf(
  party: UnitCounts,
  campStrength: number,
  fief: FiefOverview,
): PartyBattle {
  const ownStrength = strengthOf(party, fief)
  if (ownStrength > campStrength) {
    const lostStrength = Math.ceil((campStrength * campStrength) / ownStrength)
    const unitsLost = sparingTheLastReached(party, tallyLosses(party, lostStrength, fief))
    return {
      isWon: true,
      unitsLost,
      campLost: campStrength,
      survivors: byUnitKind((unit) => party[unit] - unitsLost[unit]),
    }
  }
  const campLost = Math.min(campStrength - 1, Math.ceil((ownStrength * ownStrength) / campStrength))
  return { isWon: false, unitsLost: party, campLost, survivors: byUnitKind(() => 0) }
}
