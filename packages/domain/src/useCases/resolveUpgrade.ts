import type { DomainError } from '../DomainError'
import type { Fief } from '../fief/Fief'
import { materializeStocks } from '../fief/materializeStocks'
import type { PlayerId } from '../player/PlayerId'
import type { BuildingCatalog } from '../ports/BuildingCatalog'
import type { Clock } from '../ports/Clock'
import type { FiefRepository } from '../ports/FiefRepository'
import { err, ok, type Result } from '../Result'
import type { Instant } from '../time/Instant'

export type ResolveUpgradeCommand = {
  readonly playerId: PlayerId
}

export type ResolveUpgradeDependencies = {
  readonly fiefs: FiefRepository
  readonly catalog: BuildingCatalog
  readonly clock: Clock
}

export type ResolvedFief = {
  readonly fief: Fief
  readonly hasChanged: boolean
}

const finishedUpgradeOf = (fief: Fief, now: Instant): Instant | undefined => {
  if (fief.slot.kind === 'idle') {
    return undefined
  }
  const { finishesAt } = fief.slot
  return finishesAt.epochMilliseconds <= now.epochMilliseconds ? finishesAt : undefined
}

const completeAt = (
  fief: Fief,
  finishesAt: Instant,
  catalog: BuildingCatalog,
  now: Instant,
): Result<Fief, DomainError> => {
  const stocksAtFinish = materializeStocks(fief, catalog, finishesAt)
  if (!stocksAtFinish.ok) {
    return stocksAtFinish
  }
  const completed = fief.completeUpgrade(stocksAtFinish.value)
  const stocksAtNow = materializeStocks(completed, catalog, now)
  if (!stocksAtNow.ok) {
    return stocksAtNow
  }
  return ok(completed.accruedTo(stocksAtNow.value, now))
}

export const resolveUpgrade = async (
  command: ResolveUpgradeCommand,
  { fiefs, catalog, clock }: ResolveUpgradeDependencies,
): Promise<Result<ResolvedFief, DomainError>> => {
  const stored = await fiefs.fiefOf(command.playerId)
  if (!stored.ok) {
    return stored
  }
  const fief = stored.value
  if (fief === undefined) {
    return err({ kind: 'FiefNotFound', playerId: command.playerId })
  }

  const now = clock.now()
  const finishesAt = finishedUpgradeOf(fief, now)
  if (finishesAt === undefined) {
    return ok({ fief, hasChanged: false })
  }

  const resolved = completeAt(fief, finishesAt, catalog, now)
  if (!resolved.ok) {
    return resolved
  }
  const saved = await fiefs.save(resolved.value)
  if (!saved.ok) {
    return saved
  }
  return ok({ fief: resolved.value, hasChanged: true })
}
