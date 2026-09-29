import type { CampBattle } from '../camp/CampBattle'
import type { DomainError } from '../DomainError'
import type { PlotAddress } from '../fief/PlotAddress'
import type { Result } from '../Result'

export interface CampRegistry {
  lastBattleOf(address: PlotAddress): Promise<CampBattle | undefined>
  lastBattlesIn(kingdom: number, province: number): Promise<ReadonlyArray<CampBattle>>
  record(battle: CampBattle): Promise<Result<void, DomainError>>
}
