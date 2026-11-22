import type { DomainError } from '#DomainError'
import type { PlayerId } from '#player/PlayerId'
import { err, ok, type Result } from '#Result'
import type { Instant } from '#time/Instant'
import type { BuildingLevels } from '../building/domain/BuildingLevels'
import { foundingLevels } from '../building/domain/BuildingLevels'
import { idleWorkSlot, type WorkSlot } from '../building/domain/BuildingWork'
import { TownBuildingWork } from '../building/domain/TownBuildingWork'
import type { WaitingList } from '../building/domain/WaitingList'
import { deliveredHiresOf } from '../hiring/domain/deliveredHiresOf'
import type { HireKind } from '../hiring/domain/HireKind'
import { type Hires, hiresPlus, noHires } from '../hiring/domain/Hires'
import { type HiringSlot, idleHiringSlot } from '../hiring/domain/HiringOrder'
import { TownHiring } from '../hiring/domain/TownHiring'
import { idleJobSlot, type JobSlot } from '../jobs/domain/Job'
import { TownJobs } from '../jobs/domain/TownJobs'
import { type FullSince, noStoreFull } from '../resources/FullSince'
import type { Stocks } from '../resources/Stocks'
import { refuseInvalidTown } from './refuseInvalidTown'
import type { Terrain } from './Terrain'
import type { TownAddress } from './TownAddress'
import type { TownEvent } from './TownEvent'
import type { TownId } from './TownId'
import type { TownName } from './TownName'
import type { TownSkill } from './TownSkill'
import type { StoredTown, TownState } from './TownState'
import { terrainOf } from './terrainOf'

export type TownFounding = {
  readonly id: TownId
  readonly playerId: PlayerId
  readonly name: TownName
  readonly address: TownAddress
  readonly startingStocks: Stocks
  readonly skills: ReadonlyArray<TownSkill>
  readonly at: Instant
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
  readonly buildingWork: TownBuildingWork
  readonly hiring: TownHiring
  readonly jobs: TownJobs

  private constructor(
    readonly id: TownId,
    readonly playerId: PlayerId,
    readonly name: TownName,
    readonly address: TownAddress,
    private readonly state: TownState,
  ) {
    this.buildingWork = new TownBuildingWork(this)
    this.hiring = new TownHiring(this)
    this.jobs = new TownJobs(this)
  }

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

  earnSkill(skill: TownSkill, stocksAtEarn: Stocks): Town {
    return this.changedBy({
      skills: [...this.skills, skill],
      stocks: stocksAtEarn,
      storedAt: skill.earnedAt,
    })
  }

  withFullSince(fullSince: FullSince): Town {
    return this.changedBy({ fullSince })
  }

  changedBy(change: Partial<TownState>): Town {
    return new Town(this.id, this.playerId, this.name, this.address, { ...this.state, ...change })
  }
}
