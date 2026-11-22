import type { DomainError } from '#DomainError'
import { ok, type Result } from '#Result'
import { changeTown } from '../../application/changeTown'
import type { MutateTownDependencies } from '../../application/mutateTown'
import { saveChangedTown } from '../../application/saveChangedTown'
import type { TownCatalog } from '../../domain/TownCatalog'
import type { TownReading } from '../../domain/TownReading'
import type { JobOrder } from '../domain/JobOrder'
import { dispatchJob } from './dispatchJob'

export type SendJobDependencies = MutateTownDependencies & {
  readonly townCatalog: TownCatalog
}

export class SendJob {
  constructor(private readonly dependencies: SendJobDependencies) {}

  async execute(order: JobOrder): Promise<Result<TownReading, DomainError>> {
    const { townCatalog } = this.dependencies
    return changeTown(
      order.playerId,
      async ({ towns, regionMap, townNews }, clock) => {
        const dispatched = await dispatchJob(
          order,
          { towns, map: regionMap, catalog: townCatalog },
          clock.now(),
        )
        if (!dispatched.ok) {
          return dispatched
        }
        const { town, events } = dispatched.value
        const saved = await saveChangedTown({ town, events }, towns, townNews)
        return saved.ok ? ok(clock.now()) : saved
      },
      this.dependencies,
    )
  }
}
