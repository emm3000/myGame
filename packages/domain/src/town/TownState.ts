import type { PlayerId } from '#player/PlayerId'
import type { Instant } from '#time/Instant'
import type { BuildingLevels } from './building/BuildingLevels'
import type { WorkSlot } from './building/BuildingWork'
import type { WaitingList } from './building/WaitingList'
import type { Hires } from './hiring/Hires'
import type { HiringSlot } from './hiring/HiringOrder'
import type { JobSlot } from './jobs/Job'
import type { FullSince } from './resources/FullSince'
import type { Stocks } from './resources/Stocks'
import type { TownAddress } from './TownAddress'
import type { TownEvent } from './TownEvent'
import type { TownId } from './TownId'
import type { TownName } from './TownName'
import type { TownSkill } from './TownSkill'

export type TownState = {
  readonly stocks: Stocks
  readonly storedAt: Instant
  readonly fullSince: FullSince
  readonly buildingLevels: BuildingLevels
  readonly workSlot: WorkSlot
  readonly waitingList: WaitingList
  readonly skills: ReadonlyArray<TownSkill>
  readonly hires: Hires
  readonly hiringSlot: HiringSlot
  readonly jobSlot: JobSlot
}

export type StoredTown = TownState & {
  readonly id: TownId
  readonly playerId: PlayerId
  readonly name: TownName
  readonly address: TownAddress
}

export type TownStateChange = {
  readonly state: Partial<TownState>
  readonly events: ReadonlyArray<TownEvent>
}
