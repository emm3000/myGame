import type { DomainError } from '../DomainError'
import type { Clock } from '../ports/Clock'
import { ok, type Result } from '../Result'
import type { CleanUpOrder } from './CleanUpOrder'
import type { CleanUpQuote } from './CleanUpQuote'
import { type CleanUpDispatchDependencies, dispatchedCleanUpOf } from './dispatchedCleanUpOf'

export type QuoteCleanUpDependencies = CleanUpDispatchDependencies & {
  readonly clock: Clock
}

export const quoteCleanUp = async (
  order: CleanUpOrder,
  { clock, ...dependencies }: QuoteCleanUpDependencies,
): Promise<Result<CleanUpQuote, DomainError>> => {
  const dispatched = await dispatchedCleanUpOf(order, dependencies, clock.now())
  if (!dispatched.ok) {
    return dispatched
  }
  const { cleanUp, pay } = dispatched.value.job
  return ok({ strength: cleanUp.strength, waste: cleanUp.waste, pay })
}
