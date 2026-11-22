import type { DomainError } from '#DomainError'
import type { Clock } from '#platform/domain/Clock'
import { ok, type Result } from '#Result'
import { type CleanUpDispatchDependencies, dispatchCleanUp } from '../application/dispatchCleanUp'
import type { CleanUpOrder } from '../domain/CleanUpOrder'
import type { CleanUpQuote } from '../domain/CleanUpQuote'
import { coversWaste } from '../domain/coversWaste'

export type QuoteCleanUpDependencies = CleanUpDispatchDependencies & {
  readonly clock: Clock
}

export const quoteCleanUp = async (
  order: CleanUpOrder,
  { clock, ...dependencies }: QuoteCleanUpDependencies,
): Promise<Result<CleanUpQuote, DomainError>> => {
  const dispatched = await dispatchCleanUp(order, dependencies, clock.now())
  if (!dispatched.ok) {
    return dispatched
  }
  const { cleanUp, pay } = dispatched.value.job
  return ok({ strength: cleanUp.strength, waste: cleanUp.waste, pay, covers: coversWaste(cleanUp) })
}
