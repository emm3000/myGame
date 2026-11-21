import type { AfterResponse } from '../../application/ports/AfterResponse'
import type { AfterResponseDrain } from '../../application/ports/AfterResponseDrain'
import type { FailureSink } from '../../application/ports/FailureSink'
import { thrownCauseOf } from '../../thrownCauseOf'

export const pendingWorkCap = 5

export type LifetimeExtension = (work: Promise<void>) => void

export class VercelAfterResponse implements AfterResponse, AfterResponseDrain {
  private readonly pending = new Set<Promise<void>>()

  constructor(
    private readonly extendLifetime: LifetimeExtension,
    private readonly failureSink: FailureSink,
  ) {}

  defer(start: () => Promise<void>): void {
    if (this.pending.size >= pendingWorkCap) {
      this.failureSink.write('deferred work dropped')
      return
    }
    const tracked = Promise.resolve()
      .then(start)
      .catch((error: unknown) => this.reportThrown(error))
      .finally(() => this.pending.delete(tracked))
    this.pending.add(tracked)
    this.extendLifetime(tracked)
  }

  async settled(): Promise<void> {
    await Promise.all([...this.pending])
  }

  async unsettledAfter(deadline: Promise<void>): Promise<number> {
    await Promise.race([this.settled(), deadline])
    return this.pending.size
  }

  private reportThrown(error: unknown): void {
    const cause = error instanceof Error ? thrownCauseOf(error) : typeof error
    this.failureSink.write(`deferred work ${cause}`)
  }
}
