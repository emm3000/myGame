import type { Instant, PlayerId } from '@mygame/domain'
import { and, eq, gt, sql } from 'drizzle-orm'
import type {
  Accounts,
  NewPlayer,
  PlayerAdded,
  PlayerCredentials,
  Session,
  StoredPlayer,
} from '../../auth/Accounts'
import type { PostgresSession } from './connectPostgres'
import { players, sessions } from './schema'
import { violatedUniqueConstraint } from './violatedUniqueConstraint'

const dateOf = (instant: Instant): Date => new Date(instant.epochMilliseconds)

export class DrizzleAccounts implements Accounts {
  constructor(private readonly database: PostgresSession) {}

  async addPlayer(player: NewPlayer): Promise<PlayerAdded> {
    try {
      await this.database.insert(players).values({ ...player, createdAt: dateOf(player.createdAt) })
      return 'added'
    } catch (failure) {
      if (violatedUniqueConstraint(failure) === 'players_email_unique') {
        return 'emailTaken'
      }
      throw failure
    }
  }

  async credentialsOf(email: string): Promise<PlayerCredentials | undefined> {
    const [found] = await this.database
      .select({ id: players.id, email: players.email, passwordHash: players.passwordHash })
      .from(players)
      .where(sql`lower(${players.email}) = lower(${email})`)
    return found
  }

  async playerOf(playerId: PlayerId): Promise<StoredPlayer | undefined> {
    const [found] = await this.database
      .select({ id: players.id, email: players.email })
      .from(players)
      .where(eq(players.id, playerId))
    return found
  }

  async openSession(session: Session): Promise<void> {
    await this.database
      .insert(sessions)
      .values({ ...session, expiresAt: dateOf(session.expiresAt) })
  }

  async renewSession(
    token: string,
    now: Instant,
    expiresAt: Instant,
  ): Promise<PlayerId | undefined> {
    const [renewed] = await this.database
      .update(sessions)
      .set({ expiresAt: dateOf(expiresAt) })
      .where(and(eq(sessions.token, token), gt(sessions.expiresAt, dateOf(now))))
      .returning({ playerId: sessions.playerId })
    return renewed?.playerId
  }

  async closeSession(token: string): Promise<void> {
    await this.database.delete(sessions).where(eq(sessions.token, token))
  }
}
