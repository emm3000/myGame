import type { DomainError } from '#DomainError'
import { err, ok, type Result } from '#Result'
import type { Instant } from '#time/Instant'
import type { TownState, TownStateChange } from '../../domain/TownState'
import { chargedStocks } from '../../resources/domain/chargedStocks'
import { creditedStocks, type Stocks, stocksOf } from '../../resources/domain/Stocks'
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
  constructor(private readonly town: Pick<TownState, 'hires' | 'hiringSlot'>) {}

  room(): Result<void, DomainError> {
    const slot = this.town.hiringSlot
    return slot.kind === 'busy' ? err({ kind: 'HiringSlotBusy', hire: slot.hire }) : ok(undefined)
  }

  place(
    order: HiringOrder,
    stocksAtNow: Stocks,
    now: Instant,
  ): Result<Partial<TownState>, DomainError> {
    const charged = chargedStocks(stocksAtNow, timesCount(order.costPerHire, order.count))
    if (!charged.ok) {
      return charged
    }
    return ok({ stocks: charged.value, storedAt: now, hiringSlot: order })
  }

  stop(
    target: HiringTarget,
    stocksAtNow: Stocks,
    now: Instant,
  ): Result<TownStateChange, DomainError> {
    const slot = this.town.hiringSlot
    if (slot.kind === 'idle' || !isHiringOf(target, slot)) {
      return err({ kind: 'HiringOrderNotFound', hire: target.hire, startedAt: target.startedAt })
    }
    const delivered = deliveredHiresOf(slot, now)
    const stopped = slot.count - delivered
    const refund = timesCount(slot.costPerHire, stopped)
    return ok({
      state: {
        stocks: creditedStocks(stocksAtNow, refund),
        storedAt: now,
        hires: hiresPlus(this.town.hires, slot.hire, delivered),
        hiringSlot: idleHiringSlot,
      },
      events: [
        { kind: 'hiringStopped', hire: slot.hire, delivered, stopped, refund, occurredAt: now },
      ],
    })
  }

  close(now: Instant): TownStateChange {
    const slot = this.town.hiringSlot
    if (slot.kind === 'idle') {
      return { state: {}, events: [] }
    }
    const endsAt = hiringEndsAt(slot)
    if (endsAt.epochMilliseconds > now.epochMilliseconds) {
      return { state: {}, events: [] }
    }
    return {
      state: {
        hires: hiresPlus(this.town.hires, slot.hire, slot.count),
        hiringSlot: idleHiringSlot,
      },
      events: [{ kind: 'hiringDelivered', hire: slot.hire, count: slot.count, occurredAt: endsAt }],
    }
  }
}
