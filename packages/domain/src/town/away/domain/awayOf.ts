import type { DomainError } from '#DomainError'
import { ok, type Result } from '#Result'
import type { Instant } from '#time/Instant'
import { laterOf } from '#time/laterOf'
import { settleTownTo } from '../../domain/settleTownTo'
import type { Town } from '../../domain/Town'
import type { TownCatalog } from '../../domain/TownCatalog'
import { accrueTown } from '../../resources/domain/accrueTown'
import { type Stocks, stocksOf } from '../../resources/domain/Stocks'

export type AwayRead = {
  readonly stored: Town
  readonly seenAt: Instant | undefined
  readonly read: Town
  readonly readAt: Instant
}

const stocksAt = (town: Town, catalog: TownCatalog, at: Instant): Result<Stocks, DomainError> => {
  const settled = settleTownTo(town, catalog, at)
  if (!settled.ok) {
    return settled
  }
  const accrual = accrueTown(settled.value.town, catalog, at)
  return accrual.ok ? ok(accrual.value.stocks) : accrual
}

export const awayOf = (
  { stored, seenAt, read, readAt }: AwayRead,
  catalog: TownCatalog,
): Result<Stocks | undefined, DomainError> => {
  const since = seenAt === undefined ? stored.storedAt : laterOf(seenAt, stored.storedAt)
  if (readAt.secondsSince(since) < catalog.townSettings().awayAfterSeconds) {
    return ok(undefined)
  }
  const before = stocksAt(stored, catalog, since)
  if (!before.ok) {
    return before
  }
  const after = accrueTown(read, catalog, readAt)
  if (!after.ok) {
    return after
  }
  return ok(stocksOf((resource) => after.value.stocks[resource] - before.value[resource]))
}
