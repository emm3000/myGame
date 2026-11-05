import { type DomainError, Instant, ok, type Result } from '@mygame/domain'
import {
  idleLessonSlot,
  type LessonSlot,
  type LessonSlotRepository,
  type TownId,
} from '@mygame/domain/town'
import { eq } from 'drizzle-orm'
import type { PostgresSession } from './connectPostgres'
import { townLessonSlots } from './schema'

export class DrizzleLessonSlots implements LessonSlotRepository {
  constructor(private readonly database: PostgresSession) {}

  async lessonSlotOf(townId: TownId): Promise<Result<LessonSlot, DomainError>> {
    const rows = await this.database
      .select()
      .from(townLessonSlots)
      .where(eq(townLessonSlots.townId, townId))
    const row = rows[0]
    if (row === undefined) {
      return ok(idleLessonSlot)
    }
    return ok({
      kind: 'busy',
      lessonId: row.lessonId,
      startedAt: Instant.fromEpochMilliseconds(row.startedAt.getTime()),
      finishesAt: Instant.fromEpochMilliseconds(row.finishesAt.getTime()),
    })
  }

  async save(townId: TownId, slot: LessonSlot): Promise<Result<void, DomainError>> {
    if (slot.kind === 'idle') {
      await this.database.delete(townLessonSlots).where(eq(townLessonSlots.townId, townId))
      return ok(undefined)
    }
    const columns = {
      lessonId: slot.lessonId,
      startedAt: new Date(slot.startedAt.epochMilliseconds),
      finishesAt: new Date(slot.finishesAt.epochMilliseconds),
    }
    await this.database
      .insert(townLessonSlots)
      .values({ townId, ...columns })
      .onConflictDoUpdate({ target: townLessonSlots.townId, set: columns })
    return ok(undefined)
  }
}
