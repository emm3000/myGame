import type { DomainError } from '#DomainError'
import { ok, type Result } from '#Result'
import { changeTown } from '../../application/changeTown'
import type { MutateTownDependencies } from '../../application/mutateTown'
import { saveChangedTown } from '../../application/saveChangedTown'
import type { Town } from '../../domain/Town'
import type { TownCatalog } from '../../domain/TownCatalog'
import type { TownReading } from '../../domain/TownReading'
import type { CleanUpOrder } from '../domain/CleanUpOrder'
import type { CleanUpRepository } from '../domain/CleanUpRepository'
import { coversWaste } from '../domain/coversWaste'
import type { CleanUpJob } from '../domain/Job'
import { jobInstantsOf } from '../domain/jobInstantsOf'
import { dispatchCleanUp } from './dispatchCleanUp'

export type SendCleanUpDependencies = MutateTownDependencies & {
  readonly townCatalog: TownCatalog
}

const recordCleaning = (
  town: Town,
  job: CleanUpJob,
  cleanUps: CleanUpRepository,
): Promise<Result<void, DomainError>> | Result<void, DomainError> =>
  coversWaste(job.cleanUp)
    ? cleanUps.record({
        townId: town.id,
        sentAt: job.sentAt,
        site: job.site,
        cleanedAt: jobInstantsOf(job).arrivesAt,
      })
    : ok(undefined)

export class SendCleanUp {
  constructor(private readonly dependencies: SendCleanUpDependencies) {}

  async execute(order: CleanUpOrder): Promise<Result<TownReading, DomainError>> {
    const { townCatalog } = this.dependencies
    return changeTown(
      order.playerId,
      async ({ towns, regionMap, cleanUps, townNews }, clock) => {
        const dispatched = await dispatchCleanUp(
          order,
          { towns, map: regionMap, cleanUps, catalog: townCatalog },
          clock.now(),
        )
        if (!dispatched.ok) {
          return dispatched
        }
        const { town, events, job } = dispatched.value
        const saved = await saveChangedTown({ town, events }, towns, townNews)
        if (!saved.ok) {
          return saved
        }
        const recorded = await recordCleaning(town, job, cleanUps)
        return recorded.ok ? ok(clock.now()) : recorded
      },
      this.dependencies,
    )
  }
}
