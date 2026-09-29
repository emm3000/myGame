import {
  type CampBattle,
  type CampRegistry,
  type DomainError,
  ok,
  type PlotAddress,
  type Result,
} from '@mygame/domain'

const isOnPlot = (battle: CampBattle, address: PlotAddress): boolean =>
  battle.kingdom === address.kingdom &&
  battle.province === address.province &&
  battle.plot === address.plot

export class MemoryCampRegistry implements CampRegistry {
  private readonly battles: CampBattle[] = []

  async lastBattleOf(address: PlotAddress): Promise<CampBattle | undefined> {
    return this.battles
      .filter((battle) => isOnPlot(battle, address))
      .reduce<CampBattle | undefined>(
        (latest, battle) =>
          latest === undefined ||
          battle.foughtAt.epochMilliseconds >= latest.foughtAt.epochMilliseconds
            ? battle
            : latest,
        undefined,
      )
  }

  async lastBattlesIn(kingdom: number, province: number): Promise<ReadonlyArray<CampBattle>> {
    const plots = new Set(
      this.battles
        .filter((battle) => battle.kingdom === kingdom && battle.province === province)
        .map((battle) => battle.plot),
    )
    const lastBattles = await Promise.all(
      [...plots]
        .sort((left, right) => left - right)
        .map((plot) => this.lastBattleOf({ kingdom, province, plot })),
    )
    return lastBattles.filter((battle) => battle !== undefined)
  }

  async record(battle: CampBattle): Promise<Result<void, DomainError>> {
    this.battles.push(battle)
    return ok(undefined)
  }
}
