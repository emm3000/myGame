import type { DomainError } from '#DomainError'
import type { Clock } from '#platform/domain/Clock'
import { ok, type Result } from '#Result'
import type { ReadOnlyTowns } from '../../domain/ReadOnlyTowns'
import { readInstantOf } from '../../domain/readInstantOf'
import type { TownCatalog } from '../../domain/TownCatalog'
import type { CleanUpOrder } from '../domain/CleanUpOrder'
import type { CleanUpQuote } from '../domain/CleanUpQuote'
import type { CleanUpReader } from '../domain/CleanUpReader'
import { coversWaste } from '../domain/coversWaste'
import type { RegionMapReader } from '../domain/RegionMapReader'
import { dispatchCleanUp } from './dispatchCleanUp'

export type QuoteCleanUpDependencies = {
  readonly towns: ReadOnlyTowns
  readonly regionMap: RegionMapReader
  readonly cleanUps: CleanUpReader
  readonly townCatalog: TownCatalog
  readonly clock: Clock
}

export class QuoteCleanUp {
  constructor(private readonly dependencies: QuoteCleanUpDependencies) {}

  async execute(order: CleanUpOrder): Promise<Result<CleanUpQuote, DomainError>> {
    const { towns, regionMap, cleanUps, townCatalog, clock } = this.dependencies
    const stored = await towns.townOf(order.playerId)
    if (!stored.ok) {
      return stored
    }
    const now = clock.now()
    const readAt = readInstantOf(now, stored.value?.storedAt)
    const dispatched = await dispatchCleanUp(
      order,
      { towns: { townOf: async () => stored }, map: regionMap, cleanUps, catalog: townCatalog },
      readAt,
    )
    if (!dispatched.ok) {
      return dispatched
    }
    const { cleanUp, pay } = dispatched.value.job
    return ok({
      strength: cleanUp.strength,
      waste: cleanUp.waste,
      pay,
      covers: coversWaste(cleanUp),
    })
  }
}
