import type { DomainError } from '#DomainError'
import { ok, type Result } from '#Result'
import type { ChangedTown } from '../domain/Town'
import type { TownNews } from '../domain/TownNews'
import type { TownRepository } from '../domain/TownRepository'
import { saveChangedTown } from './saveChangedTown'

export const saveResolvedTown = async (
  resolved: ChangedTown,
  towns: TownRepository,
  news: TownNews,
): Promise<Result<void, DomainError>> =>
  resolved.events.length === 0 ? ok(undefined) : saveChangedTown(resolved, towns, news)
