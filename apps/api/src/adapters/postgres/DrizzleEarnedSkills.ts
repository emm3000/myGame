import { type DomainError, Instant, ok, type PlayerId, type Result } from '@mygame/domain'
import type { EarnedSkillRepository, TownSkill } from '@mygame/domain/town'
import { asc, eq, sql } from 'drizzle-orm'
import type { PostgresSession } from './connectPostgres'
import { earnedSkills } from './schema'

export class DrizzleEarnedSkills implements EarnedSkillRepository {
  constructor(private readonly database: PostgresSession) {}

  async skillsOf(playerId: PlayerId): Promise<Result<ReadonlyArray<TownSkill>, DomainError>> {
    const rows = await this.database
      .select({
        lessonId: earnedSkills.lessonId,
        resource: earnedSkills.resource,
        ratePercent: earnedSkills.ratePercent,
        earnedAt: earnedSkills.earnedAt,
      })
      .from(earnedSkills)
      .where(eq(earnedSkills.playerId, playerId))
      .orderBy(asc(earnedSkills.earnedAt), sql`${earnedSkills.lessonId} COLLATE "C"`)
    return ok(
      rows.map((row) => ({
        ...row,
        earnedAt: Instant.fromEpochMilliseconds(row.earnedAt.getTime()),
      })),
    )
  }

  async save(playerId: PlayerId, skill: TownSkill): Promise<Result<void, DomainError>> {
    await this.database
      .insert(earnedSkills)
      .values({
        playerId,
        lessonId: skill.lessonId,
        resource: skill.resource,
        ratePercent: skill.ratePercent,
        earnedAt: new Date(skill.earnedAt.epochMilliseconds),
      })
      .onConflictDoNothing({ target: [earnedSkills.playerId, earnedSkills.lessonId] })
    return ok(undefined)
  }
}
