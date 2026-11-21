import type { DomainError } from '#DomainError'
import { ok, type Result } from '#Result'
import type { TownNews } from '../ports/TownNews'
import type { TownRepository } from '../ports/TownRepository'
import type { ChangedTown } from '../Town'

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
