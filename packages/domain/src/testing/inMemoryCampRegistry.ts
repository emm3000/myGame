import type { CampBattle } from '../camp/CampBattle'
import type { PlotAddress } from '../fief/PlotAddress'
import type { CampRegistry } from '../ports/CampRegistry'
import { ok } from '../Result'

const isInProvince = (battle: CampBattle, kingdom: number, province: number): boolean =>
  battle.kingdom === kingdom && battle.province === province

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
    latestOf(
      battles.filter(
        (battle) =>
          isInProvince(battle, address.kingdom, address.province) && battle.plot === address.plot,
      ),
    )
  return {
    lastBattleOf: async (address) => lastBattleOf(address),
    lastBattlesIn: async (kingdom, province) =>
      [
        ...new Set(
          battles
            .filter((battle) => isInProvince(battle, kingdom, province))
            .map((battle) => battle.plot),
        ),
      ]
        .sort((left, right) => left - right)
        .flatMap((plot) => lastBattleOf({ kingdom, province, plot }) ?? []),
    record: async (battle) => {
      battles.push(battle)
      return ok(undefined)
    },
  }
}
