import type { DomainError } from '../../DomainError'
import { err, ok, type Result } from '../../Result'
import type { Instant } from '../../time/Instant'
import { hireKinds } from '../hiring/hireKinds'
import type { TownCatalog } from '../ports/TownCatalog'
import { creditedStocks, type Stocks } from '../resources/Stocks'
import type { ChangedTown, Town, TownState } from '../Town'
import type { TownEvent } from '../TownEvent'
import { coversWaste } from './coversWaste'
import { idleJobSlot, type Job, type JobCleanUp } from './Job'
import { jobInstantsOf } from './jobInstantsOf'
import { jobPayOfMilliseconds } from './jobPayOfMilliseconds'
import { jobPhaseAt } from './jobPhaseAt'
import { terrainOf } from './terrainOf'

const jobReturnOf = (job: Job, occurredAt: Instant): TownEvent => ({
  kind: job.calledBackAt === undefined ? 'jobBack' : 'jobCalledBack',
  site: job.site,
  pay: job.pay,
  occurredAt,
})

const arrivalOf = ({ site, pay }: Job, cleanUp: JobCleanUp, occurredAt: Instant): TownEvent =>
  coversWaste(cleanUp)
    ? { kind: 'cleanUpDone', site, reward: pay, occurredAt }
    : { kind: 'cleanUpFailed', site, occurredAt }

export class TownJobs {
  constructor(
    private readonly town: Town,
    private readonly changed: (town: Town, change: Partial<TownState>) => Town,
  ) {}

  room(): Result<void, DomainError> {
    return this.town.jobSlot.kind === 'out' ? err({ kind: 'TeamAlreadyOut' }) : ok(undefined)
  }

  send(job: Job): Result<Town, DomainError> {
    const room = this.room()
    if (!room.ok) {
      return room
    }
    const atHome = this.town.hiresAtHomeAt(job.sentAt)
    const short = hireKinds.find((hire) => job.team[hire] > atHome[hire])
    if (short !== undefined) {
      return err({
        kind: 'NotEnoughHiresAtHome',
        hire: short,
        count: job.team[short],
        atHome: atHome[short],
      })
    }
    return ok(this.changed(this.town, { jobSlot: job }))
  }

  callBack(sentAt: Instant, now: Instant, catalog: TownCatalog): Result<Town, DomainError> {
    const slot = this.town.jobSlot
    if (slot.kind === 'idle' || slot.sentAt.epochMilliseconds !== sentAt.epochMilliseconds) {
      return err({ kind: 'JobNotFound', sentAt })
    }
    if (jobPhaseAt(slot, now) === 'returning') {
      return err({ kind: 'JobAlreadyReturning' })
    }
    const workedMilliseconds = Math.max(
      0,
      now.epochMilliseconds - jobInstantsOf(slot).arrivesAt.epochMilliseconds,
    )
    const pay = jobPayOfMilliseconds(
      terrainOf(slot.site.area),
      slot.team,
      workedMilliseconds,
      catalog,
      slot.payPercent,
    )
    return ok(this.changed(this.town, { jobSlot: { ...slot, calledBackAt: now, pay } }))
  }

  arriveAtWaste(): ChangedTown {
    const slot = this.town.jobSlot
    if (slot.kind === 'idle' || slot.cleanUp === undefined || slot.cleanUp.hasArrived) {
      return { town: this.town, events: [] }
    }
    return {
      town: this.changed(this.town, {
        jobSlot: { ...slot, cleanUp: { ...slot.cleanUp, hasArrived: true } },
      }),
      events: [arrivalOf(slot, slot.cleanUp, jobInstantsOf(slot).arrivesAt)],
    }
  }

  comeBack(stocksAtReturn: Stocks): ChangedTown {
    const slot = this.town.jobSlot
    if (slot.kind === 'idle') {
      return { town: this.town, events: [] }
    }
    const { returnsAt } = jobInstantsOf(slot)
    return {
      town: this.changed(this.town, {
        stocks: creditedStocks(stocksAtReturn, slot.pay),
        storedAt: returnsAt,
        jobSlot: idleJobSlot,
      }),
      events: [jobReturnOf(slot, returnsAt)],
    }
  }
}
