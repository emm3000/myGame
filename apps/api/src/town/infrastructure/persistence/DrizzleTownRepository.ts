import {
  buildingKinds,
  type DomainError,
  err,
  type HiringSlot,
  hireKinds,
  type JobSlot,
  ok,
  type PlayerId,
  type Result,
  type SiteAddress,
  type Town,
  type TownRepository,
} from '@mygame/domain'
import { eq } from 'drizzle-orm'
import type { PostgresSession } from '#platform/infrastructure/persistence/connectPostgres'
import { violatedUniqueConstraint } from '#platform/infrastructure/persistence/violatedUniqueConstraint'
import { aggregatedTown } from './aggregatedTown'
import { townHires, townHiringOrders } from './hiringTables'
import { townJobs } from './jobsTables'
import {
  hiringOrderColumns,
  jobColumns,
  storedBuildings,
  townColumns,
  waitingWorkColumns,
} from './townColumns'
import { townFromRow } from './townFromRow'
import { townBuildings, towns, townWaitingWork } from './townTables'

export type TownRead = 'lockedForUpdate' | 'lockFree'

const saveHiringSlot = async (
  database: PostgresSession,
  townId: string,
  slot: HiringSlot,
): Promise<void> => {
  const columns = hiringOrderColumns(slot)
  if (columns === undefined) {
    await database.delete(townHiringOrders).where(eq(townHiringOrders.townId, townId))
    return
  }
  await database
    .insert(townHiringOrders)
    .values({ townId, ...columns })
    .onConflictDoUpdate({ target: townHiringOrders.townId, set: columns })
}

const saveJobSlot = async (
  database: PostgresSession,
  townId: string,
  slot: JobSlot,
): Promise<void> => {
  const columns = jobColumns(slot)
  if (columns === undefined) {
    await database.delete(townJobs).where(eq(townJobs.townId, townId))
    return
  }
  await database
    .insert(townJobs)
    .values({ townId, ...columns })
    .onConflictDoUpdate({ target: townJobs.townId, set: columns })
}

const siteOf = ({ address: { region, area, site } }: Town): SiteAddress => ({ region, area, site })

export class DrizzleTownRepository implements TownRepository {
  constructor(
    private readonly database: PostgresSession,
    private readonly read: TownRead,
  ) {}

  async holdsTown(playerId: PlayerId): Promise<boolean> {
    const held = await this.database
      .select({ id: towns.id })
      .from(towns)
      .where(eq(towns.playerId, playerId))
    return held.length > 0
  }

  async occupiedSites(): Promise<ReadonlyArray<SiteAddress>> {
    return this.database
      .select({ region: towns.region, area: towns.area, site: towns.site })
      .from(towns)
  }

  async townOf(playerId: PlayerId): Promise<Result<Town | undefined, DomainError>> {
    const query = this.database
      .select({
        town: towns,
        ...aggregatedTown,
      })
      .from(towns)
      .where(eq(towns.playerId, playerId))
    const rows = await (this.read === 'lockedForUpdate'
      ? query.for('update', { of: towns })
      : query)
    const first = rows[0]
    if (first === undefined) {
      return ok(undefined)
    }
    return townFromRow(first)
  }

  async save(town: Town): Promise<Result<void, DomainError>> {
    const { id, ...changes } = townColumns(town)
    try {
      await this.database.transaction(async (transaction) => {
        await transaction
          .insert(towns)
          .values({ id, ...changes })
          .onConflictDoUpdate({ target: towns.id, set: changes })
        for (const building of buildingKinds) {
          const level = town.buildingLevels[building]
          await transaction
            .insert(townBuildings)
            .values({ townId: id, building: storedBuildings[building], level })
            .onConflictDoUpdate({
              target: [townBuildings.townId, townBuildings.building],
              set: { level },
            })
        }
        await transaction.delete(townWaitingWork).where(eq(townWaitingWork.townId, id))
        const waitingRows = waitingWorkColumns(town)
        if (waitingRows.length > 0) {
          await transaction.insert(townWaitingWork).values([...waitingRows])
        }
        for (const hire of hireKinds) {
          const count = town.hires[hire]
          await transaction
            .insert(townHires)
            .values({ townId: id, hire, count })
            .onConflictDoUpdate({ target: [townHires.townId, townHires.hire], set: { count } })
        }
        await saveHiringSlot(transaction, id, town.hiringSlot)
        await saveJobSlot(transaction, id, town.jobSlot)
      })
      return ok(undefined)
    } catch (failure) {
      const constraint = violatedUniqueConstraint(failure)
      if (constraint === 'towns_site_unique') {
        return err({ kind: 'SiteTaken', site: siteOf(town) })
      }
      if (constraint === 'towns_player_unique') {
        return err({ kind: 'PlayerAlreadyHoldsTown', playerId: town.playerId })
      }
      throw failure
    }
  }
}
