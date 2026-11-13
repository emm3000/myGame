import type { AfterResponse } from '../../auth/AfterResponse'

export type LifetimeExtension = (work: Promise<void>) => void

export class VercelAfterResponse implements AfterResponse {
  private readonly pending = new Set<Promise<void>>()

  constructor(private readonly extendLifetime: LifetimeExtension) {}

  defer(work: Promise<void>): void {
    const tracked = work.finally(() => this.pending.delete(tracked))
    this.pending.add(tracked)
    this.extendLifetime(tracked)
  }

  async settled(): Promise<void> {
    await Promise.allSettled([...this.pending])
  }
}
