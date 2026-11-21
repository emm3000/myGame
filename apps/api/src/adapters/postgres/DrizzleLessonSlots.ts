import {
  type DomainError,
  type LessonSlot,
  type LessonSlotRepository,
  ok,
  type Result,
  type TownId,
} from '@mygame/domain'
import { eq } from 'drizzle-orm'
import type { PostgresSession } from '../../platform/infrastructure/postgres/connectPostgres'
import { townLessonSlots } from '../../town/infrastructure/postgres/townTables'
import { lessonSlotOf } from './lessonSlotOf'

export class DrizzleLessonSlots implements LessonSlotRepository {
  constructor(private readonly database: PostgresSession) {}

  async lessonSlotOf(townId: TownId): Promise<Result<LessonSlot, DomainError>> {
    const [row] = await this.database
      .select()
      .from(townLessonSlots)
      .where(eq(townLessonSlots.townId, townId))
    return ok(lessonSlotOf(row ?? null))
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
