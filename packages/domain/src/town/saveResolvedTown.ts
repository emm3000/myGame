import type { DomainError } from '../DomainError'
import { ok, type Result } from '../Result'
import { saveChangedTown } from './saveChangedTown'
import type { ChangedTown } from './Town'
import type { TownNews } from './TownNews'
import type { TownRepository } from './TownRepository'

export const saveResolvedTown = async (
  resolved: ChangedTown,
  towns: TownRepository,
  news: TownNews,
): Promise<Result<void, DomainError>> =>
  resolved.events.length === 0 ? ok(undefined) : saveChangedTown(resolved, towns, news)
