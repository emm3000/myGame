import { Instant, type PlayerId } from '@mygame/domain'
import { eq, sql } from 'drizzle-orm'
import { cards } from '#learning/infrastructure/postgres/learningTables'
import type { PostgresSession } from '#platform/infrastructure/postgres/connectPostgres'
import { earnedSkills, townLessonSlots } from '#town/infrastructure/postgres/schoolTables'
import { towns } from '#town/infrastructure/postgres/townTables'
import type {
  ChromeProgress,
  ChromeProgressReader,
} from '../../application/ports/ChromeProgressReader'
import { players } from './accountTables'

export class DrizzleChromeProgress implements ChromeProgressReader {
  constructor(private readonly database: PostgresSession) {}

  async chromeProgressOf(playerId: PlayerId): Promise<ChromeProgress | undefined> {
    const [row] = await this.database
      .select({
        wordIds: sql<
          ReadonlyArray<string>
        >`coalesce((SELECT array_agg(${cards.wordId} ORDER BY ${cards.wordId} COLLATE "C") FROM ${cards} WHERE ${cards.playerId} = ${players.id}), '{}')`,
        lessonIds: sql<
          ReadonlyArray<string>
        >`coalesce((SELECT array_agg(${earnedSkills.lessonId} ORDER BY ${earnedSkills.lessonId} COLLATE "C") FROM ${earnedSkills} WHERE ${earnedSkills.playerId} = ${players.id}), '{}')`,
        slotLessonId: townLessonSlots.lessonId,
        slotFinishesAt: townLessonSlots.finishesAt,
      })
      .from(players)
      .leftJoin(towns, eq(towns.playerId, players.id))
      .leftJoin(townLessonSlots, eq(townLessonSlots.townId, towns.id))
      .where(eq(players.id, playerId))
    if (row === undefined) {
      return undefined
    }
    const { wordIds, lessonIds, slotLessonId, slotFinishesAt } = row
    return {
      cards: wordIds.map((wordId) => ({ wordId })),
      skills: lessonIds.map((lessonId) => ({ lessonId })),
      lessonSlot:
        slotLessonId === null || slotFinishesAt === null
          ? null
          : {
              lessonId: slotLessonId,
              finishesAt: Instant.fromEpochMilliseconds(slotFinishesAt.getTime()),
            },
    }
  }
}
