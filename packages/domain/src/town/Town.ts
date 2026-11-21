import type { DomainError } from '../DomainError'
import type { PlayerId } from '../player/PlayerId'
import { err, ok, type Result } from '../Result'
import type { Instant } from '../time/Instant'
import type { BuildingLevels } from './building/BuildingLevels'
import { foundingLevels } from './building/BuildingLevels'
import { idleWorkSlot, type WorkSlot } from './building/BuildingWork'
import { TownBuildingWork } from './building/TownBuildingWork'
import type { WaitingList } from './building/WaitingList'
import { type FullSince, noStoreFull } from './FullSince'
import { deliveredHiresOf } from './hiring/deliveredHiresOf'
import type { HireKind } from './hiring/HireKind'
import { type Hires, hiresPlus, noHires } from './hiring/Hires'
import { type HiringSlot, idleHiringSlot } from './hiring/HiringOrder'
import { TownHiring } from './hiring/TownHiring'
import { idleJobSlot, type JobSlot } from './jobs/Job'
import type { Terrain } from './jobs/Terrain'
import { TownJobs } from './jobs/TownJobs'
import { terrainOf } from './jobs/terrainOf'
import { refuseInvalidTown } from './refuseInvalidTown'
import type { Stocks } from './Stocks'
import type { TownAddress } from './TownAddress'
import type { TownEvent } from './TownEvent'
import type { TownId } from './TownId'
import type { TownName } from './TownName'
import type { TownSkill } from './TownSkill'

export type TownFounding = {
  readonly id: TownId
  readonly playerId: PlayerId
  readonly name: TownName
  readonly address: TownAddress
  readonly startingStocks: Stocks
  readonly skills: ReadonlyArray<TownSkill>
  readonly at: Instant
}

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

export type ChangedTown = {
  readonly town: Town
  readonly events: ReadonlyArray<TownEvent>
}

const hiresOf = (countOf: (hire: HireKind) => number): Hires => ({
  worker: countOf('worker'),
  truck: countOf('truck'),
})

export class Town {
  private constructor(
    readonly id: TownId,
    readonly playerId: PlayerId,
    readonly name: TownName,
    readonly address: TownAddress,
    private readonly state: TownState,
  ) {}

  static found({ id, playerId, name, address, startingStocks, skills, at }: TownFounding): Town {
    return new Town(id, playerId, name, address, {
      stocks: startingStocks,
      storedAt: at,
      fullSince: noStoreFull,
      buildingLevels: foundingLevels,
      workSlot: idleWorkSlot,
      waitingList: [],
      skills,
      hires: noHires,
      hiringSlot: idleHiringSlot,
      jobSlot: idleJobSlot,
    })
  }

  static restore(stored: StoredTown): Result<Town, DomainError> {
    const refusal = refuseInvalidTown(stored)
    if (refusal !== undefined) {
      return err(refusal)
    }
    const { id, playerId, name, address, ...state } = stored
    return ok(new Town(id, playerId, name, address, state))
  }

  get stocks(): Stocks {
    return this.state.stocks
  }

  get storedAt(): Instant {
    return this.state.storedAt
  }

  get fullSince(): FullSince {
    return this.state.fullSince
  }

  get buildingLevels(): BuildingLevels {
    return this.state.buildingLevels
  }

  get workSlot(): WorkSlot {
    return this.state.workSlot
  }

  get waitingList(): WaitingList {
    return this.state.waitingList
  }

  get skills(): ReadonlyArray<TownSkill> {
    return this.state.skills
  }

  get hires(): Hires {
    return this.state.hires
  }

  get hiringSlot(): HiringSlot {
    return this.state.hiringSlot
  }

  get jobSlot(): JobSlot {
    return this.state.jobSlot
  }

  get staffedHires(): Hires {
    const slot = this.hiringSlot
    return slot.kind === 'busy' ? hiresPlus(this.hires, slot.hire, slot.count) : this.hires
  }

  get projectedLevels(): BuildingLevels {
    const projected = { ...this.buildingLevels }
    const slot = this.workSlot
    const planned = slot.kind === 'busy' ? [slot, ...this.waitingList] : this.waitingList
    for (const { building, level } of planned) {
      projected[building] = level
    }
    return projected
  }

  get terrain(): Terrain {
    return terrainOf(this.address.area)
  }

  hiresAt(at: Instant): Hires {
    const slot = this.hiringSlot
    return slot.kind === 'busy'
      ? hiresPlus(this.hires, slot.hire, deliveredHiresOf(slot, at))
      : this.hires
  }

  hiresAtHomeAt(at: Instant): Hires {
    const atHand = this.hiresAt(at)
    const slot = this.jobSlot
    return slot.kind === 'idle' ? atHand : hiresOf((hire) => atHand[hire] - slot.team[hire])
  }

  get buildingWork(): TownBuildingWork {
    return new TownBuildingWork(this, (change) => this.changed(change))
  }

  get hiring(): TownHiring {
    return new TownHiring(this, (change) => this.changed(change))
  }

  get jobs(): TownJobs {
    return new TownJobs(this, (change) => this.changed(change))
  }

  earnSkill(skill: TownSkill, stocksAtEarn: Stocks): Town {
    return this.changed({
      skills: [...this.skills, skill],
      stocks: stocksAtEarn,
      storedAt: skill.earnedAt,
    })
  }

  withFullSince(fullSince: FullSince): Town {
    return this.changed({ fullSince })
  }

  private changed(change: Partial<TownState>): Town {
    return new Town(this.id, this.playerId, this.name, this.address, { ...this.state, ...change })
  }
}
