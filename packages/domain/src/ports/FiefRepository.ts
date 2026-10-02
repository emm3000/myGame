import type { DomainError } from '../DomainError'
import type { Fief } from '../fief/Fief'
import type { FiefId } from '../fief/FiefId'
import type { PlotAddress } from '../fief/PlotAddress'
import type { PlayerId } from '../player/PlayerId'
import type { Result } from '../Result'

export interface FiefRepository {
  occupiedPlots(): Promise<ReadonlyArray<PlotAddress>>
  holdsFief(playerId: PlayerId): Promise<boolean>
  fiefsOf(playerId: PlayerId): Promise<ReadonlyArray<FiefId>>
  foundingsOnTheRoadOf(playerId: PlayerId): Promise<number>
  fiefOf(fiefId: FiefId): Promise<Result<Fief | undefined, DomainError>>
  save(fief: Fief): Promise<Result<void, DomainError>>
}
