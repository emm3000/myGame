import type { DomainError } from '../../DomainError'
import { err, ok, type Result } from '../../Result'
import type { Instant } from '../../time/Instant'
import { chargedStocks, creditedStocks, type Stocks, stocksOf } from '../Stocks'
import type { ChangedTown, Town, TownState } from '../Town'
import { deliveredHiresOf } from './deliveredHiresOf'
import { hiresPlus } from './Hires'
import { type HiringOrder, type HiringTarget, idleHiringSlot } from './HiringOrder'
import { hiringEndsAt } from './hiringEndsAt'

const timesCount = (amounts: Stocks, count: number): Stocks =>
  stocksOf((resource) => amounts[resource] * count)

const isHiringOf = (target: HiringTarget, order: HiringOrder): boolean =>
  order.hire === target.hire &&
  order.startedAt.epochMilliseconds === target.startedAt.epochMilliseconds

export class TownHiring {
  constructor(
    private readonly town: Town,
    private readonly changed: (town: Town, change: Partial<TownState>) => Town,
  ) {}

  room(): Result<void, DomainError> {
    const slot = this.town.hiringSlot
    return slot.kind === 'busy' ? err({ kind: 'HiringSlotBusy', hire: slot.hire }) : ok(undefined)
  }

  place(order: HiringOrder, stocksAtNow: Stocks, now: Instant): Result<Town, DomainError> {
    const charged = chargedStocks(stocksAtNow, timesCount(order.costPerHire, order.count))
    if (!charged.ok) {
      return charged
    }
    return ok(this.changed(this.town, { stocks: charged.value, storedAt: now, hiringSlot: order }))
  }

  stop(target: HiringTarget, stocksAtNow: Stocks, now: Instant): Result<ChangedTown, DomainError> {
    const slot = this.town.hiringSlot
    if (slot.kind === 'idle' || !isHiringOf(target, slot)) {
      return err({ kind: 'HiringOrderNotFound', hire: target.hire, startedAt: target.startedAt })
    }
    const delivered = deliveredHiresOf(slot, now)
    const stopped = slot.count - delivered
    const refund = timesCount(slot.costPerHire, stopped)
    return ok({
      town: this.changed(this.town, {
        stocks: creditedStocks(stocksAtNow, refund),
        storedAt: now,
        hires: hiresPlus(this.town.hires, slot.hire, delivered),
        hiringSlot: idleHiringSlot,
      }),
      events: [
        { kind: 'hiringStopped', hire: slot.hire, delivered, stopped, refund, occurredAt: now },
      ],
    })
  }

  close(now: Instant): ChangedTown {
    const slot = this.town.hiringSlot
    if (slot.kind === 'idle') {
      return { town: this.town, events: [] }
    }
    const endsAt = hiringEndsAt(slot)
    if (endsAt.epochMilliseconds > now.epochMilliseconds) {
      return { town: this.town, events: [] }
    }
    return {
      town: this.changed(this.town, {
        hires: hiresPlus(this.town.hires, slot.hire, slot.count),
        hiringSlot: idleHiringSlot,
      }),
      events: [{ kind: 'hiringDelivered', hire: slot.hire, count: slot.count, occurredAt: endsAt }],
    }
  }
}
