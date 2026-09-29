import type { CampBattle } from '../camp/CampBattle'
import type { PlotAddress } from '../fief/PlotAddress'
import type { CampRegistry } from '../ports/CampRegistry'
import { ok } from '../Result'

const isOnPlot = (battle: CampBattle, address: PlotAddress): boolean =>
  battle.kingdom === address.kingdom &&
  battle.province === address.province &&
  battle.plot === address.plot

const latestOf = (battles: ReadonlyArray<CampBattle>): CampBattle | undefined =>
  battles.reduce<CampBattle | undefined>(
    (latest, battle) =>
      latest === undefined || battle.foughtAt.epochMilliseconds >= latest.foughtAt.epochMilliseconds
        ? battle
        : latest,
    undefined,
  )

export const inMemoryCampRegistry = (fought: ReadonlyArray<CampBattle>): CampRegistry => {
  const battles = [...fought]
  const lastBattleOf = (address: PlotAddress): CampBattle | undefined =>
    latestOf(battles.filter((battle) => isOnPlot(battle, address)))
  return {
    lastBattleOf: async (address) => lastBattleOf(address),
    lastBattlesIn: async (kingdom, province) =>
      [...new Set(battles.map((battle) => battle.plot))].flatMap((plot) => {
        const last = lastBattleOf({ kingdom, province, plot })
        return last === undefined ? [] : [last]
      }),
    record: async (battle) => {
      battles.push(battle)
      return ok(undefined)
    },
  }
}
