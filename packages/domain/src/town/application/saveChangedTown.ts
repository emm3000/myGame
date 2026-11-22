import type { DomainError } from '#DomainError'
import { ok, type Result } from '#Result'
import type { ChangedTown } from '../domain/Town'
import type { TownNews } from '../domain/TownNews'
import type { TownRepository } from '../domain/TownRepository'

export const saveChangedTown = async (
  { town, events }: ChangedTown,
  towns: TownRepository,
  news: TownNews,
): Promise<Result<void, DomainError>> => {
  const saved = await towns.save(town)
  if (!saved.ok) {
    return saved
  }
  if (events.length === 0) {
    return ok(undefined)
  }
  return news.record(town.id, events)
}
