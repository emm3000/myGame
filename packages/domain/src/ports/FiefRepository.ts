import type { DomainError } from '../DomainError'
import type { Fief } from '../fief/Fief'
import type { PlotAddress } from '../fief/PlotAddress'
import type { PlayerId } from '../player/PlayerId'
import type { Result } from '../Result'

export interface FiefRepository {
  occupiedPlots(): Promise<ReadonlyArray<PlotAddress>>
  holdsFief(playerId: PlayerId): Promise<boolean>
  fiefOf(playerId: PlayerId): Promise<Fief | undefined>
  save(fief: Fief): Promise<Result<void, DomainError>>
}
