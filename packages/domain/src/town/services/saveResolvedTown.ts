import type { DomainError } from '#DomainError'
import { ok, type Result } from '#Result'
import type { TownNews } from '../ports/TownNews'
import type { TownRepository } from '../ports/TownRepository'
import type { ChangedTown } from '../Town'
import { saveChangedTown } from './saveChangedTown'

export const saveResolvedTown = async (
  resolved: ChangedTown,
  towns: TownRepository,
  news: TownNews,
): Promise<Result<void, DomainError>> =>
  resolved.events.length === 0 ? ok(undefined) : saveChangedTown(resolved, towns, news)
