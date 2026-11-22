import type {
  Accounts,
  Instant,
  NewPlayer,
  PlayerAdded,
  PlayerCredentials,
  PlayerId,
  Scaffold,
  StoredPlayer,
} from '@mygame/domain'
import { and, eq, isNull, sql } from 'drizzle-orm'
import type { PostgresSession } from '#platform/infrastructure/persistence/connectPostgres'
import { violatedUniqueConstraint } from '#platform/infrastructure/persistence/violatedUniqueConstraint'
import { players } from './accountTables'
import { storedScaffoldColumns } from './storedScaffoldColumns'

const dateOf = (instant: Instant): Date => new Date(instant.epochMilliseconds)

const emailVerified = sql<boolean>`${players.emailVerifiedAt} IS NOT NULL`

const storedPlayerColumns = {
  id: players.id,
  email: players.email,
  emailVerified,
  ...storedScaffoldColumns,
}

export class DrizzleAccounts implements Accounts {
  constructor(private readonly database: PostgresSession) {}

  async addPlayer(player: NewPlayer): Promise<PlayerAdded> {
    try {
      const [added] = await this.database
        .insert(players)
        .values({
          ...player,
          createdAt: dateOf(player.createdAt),
          reportReadAt: dateOf(player.createdAt),
        })
        .returning(storedPlayerColumns)
      if (added === undefined) {
        throw new Error(`Player ${player.id} was not stored`)
      }
      return { kind: 'added', player: added }
    } catch (failure) {
      if (violatedUniqueConstraint(failure) === 'players_email_unique') {
        return { kind: 'emailTaken' }
      }
      throw failure
    }
  }

  async credentialsOf(email: string): Promise<PlayerCredentials | undefined> {
    const [found] = await this.database
      .select({
        ...storedPlayerColumns,
        passwordHash: players.passwordHash,
      })
      .from(players)
      .where(sql`lower(${players.email}) = lower(${email})`)
    return found
  }

  async playerOf(playerId: PlayerId): Promise<StoredPlayer | undefined> {
    const [found] = await this.database
      .select(storedPlayerColumns)
      .from(players)
      .where(eq(players.id, playerId))
    return found
  }

  async lockPlayer(playerId: PlayerId): Promise<void> {
    await this.database
      .select({ id: players.id })
      .from(players)
      .where(eq(players.id, playerId))
      .for('no key update')
  }

  async markEmailVerified(playerId: PlayerId, now: Instant): Promise<void> {
    await this.database
      .update(players)
      .set({ emailVerifiedAt: dateOf(now) })
      .where(and(eq(players.id, playerId), isNull(players.emailVerifiedAt)))
  }

  async storePasswordHash(playerId: PlayerId, passwordHash: string): Promise<void> {
    await this.database.update(players).set({ passwordHash }).where(eq(players.id, playerId))
  }

  async storeScaffold(playerId: PlayerId, scaffold: Scaffold): Promise<StoredPlayer> {
    const [stored] = await this.database
      .update(players)
      .set({ scaffold, scaffoldVersion: sql`${players.scaffoldVersion} + 1` })
      .where(eq(players.id, playerId))
      .returning(storedPlayerColumns)
    if (stored === undefined) {
      throw new Error(`Player ${playerId} holds no account`)
    }
    return stored
  }
}
