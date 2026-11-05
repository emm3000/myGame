import { type DomainError, err, Instant, ok, type PlayerId, type Result } from '@mygame/domain'
import {
  type BuildingKind,
  type BuildingLevels,
  buildingKinds,
  type FullSince,
  type SiteAddress,
  Town,
  TownAddress,
  TownName,
  type TownRepository,
} from '@mygame/domain/town'
import { eq } from 'drizzle-orm'
import type { PostgresSession } from './connectPostgres'
import { type townBuilding, townBuildings, towns } from './schema'
import { violatedUniqueConstraint } from './violatedUniqueConstraint'

type StoredTownBuilding = (typeof townBuilding.enumValues)[number]

type TownRow = typeof towns.$inferSelect

type LevelRow = { readonly building: StoredTownBuilding | null; readonly level: number | null }

const storedBuildings: Readonly<Record<BuildingKind, StoredTownBuilding>> = {
  homes: 'homes',
  farm: 'farm',
  factory: 'factory',
  powerStation: 'power_station',
  storage: 'storage',
  school: 'school',
  office: 'office',
}

const buildingKindOf: Readonly<Record<StoredTownBuilding, BuildingKind>> = {
  homes: 'homes',
  farm: 'farm',
  factory: 'factory',
  power_station: 'powerStation',
  storage: 'storage',
  school: 'school',
  office: 'office',
}

const instantOf = (date: Date | null): Instant | null =>
  date === null ? null : Instant.fromEpochMilliseconds(date.getTime())

const dateOf = (instant: Instant | null): Date | null =>
  instant === null ? null : new Date(instant.epochMilliseconds)

const levelsOf = (rows: ReadonlyArray<LevelRow>): BuildingLevels => {
  const levels: Record<BuildingKind, number> = {
    homes: 0,
    farm: 0,
    factory: 0,
    powerStation: 0,
    storage: 0,
    school: 0,
    office: 0,
  }
  for (const { building, level } of rows) {
    if (building !== null && level !== null) {
      levels[buildingKindOf[building]] = level
    }
  }
  return levels
}

const fullSinceOf = (row: TownRow): FullSince => ({
  money: instantOf(row.fullSinceMoney),
  food: instantOf(row.fullSinceFood),
  power: instantOf(row.fullSincePower),
  material: instantOf(row.fullSinceMaterial),
})

const townFrom = (row: TownRow, levelRows: ReadonlyArray<LevelRow>): Result<Town, DomainError> => {
  const name = TownName.create(row.name)
  if (!name.ok) {
    return name
  }
  const address = TownAddress.create(row.region, row.area, row.site)
  if (!address.ok) {
    return address
  }
  return Town.restore({
    id: row.id,
    playerId: row.playerId,
    name: name.value,
    address: address.value,
    stocks: { money: row.money, food: row.food, power: row.power, material: row.material },
    storedAt: Instant.fromEpochMilliseconds(row.storedAt.getTime()),
    fullSince: fullSinceOf(row),
    buildingLevels: levelsOf(levelRows),
  })
}

const rowOf = (town: Town): TownRow => ({
  id: town.id,
  playerId: town.playerId,
  region: town.address.region,
  area: town.address.area,
  site: town.address.site,
  name: town.name.value,
  money: town.stocks.money,
  food: town.stocks.food,
  power: town.stocks.power,
  material: town.stocks.material,
  storedAt: new Date(town.storedAt.epochMilliseconds),
  fullSinceMoney: dateOf(town.fullSince.money),
  fullSinceFood: dateOf(town.fullSince.food),
  fullSincePower: dateOf(town.fullSince.power),
  fullSinceMaterial: dateOf(town.fullSince.material),
})

const siteOf = ({ address: { region, area, site } }: Town): SiteAddress => ({ region, area, site })

export class DrizzleTownRepository implements TownRepository {
  constructor(private readonly database: PostgresSession) {}

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
    const rows = await this.database
      .select({ town: towns, building: townBuildings.building, level: townBuildings.level })
      .from(towns)
      .leftJoin(townBuildings, eq(townBuildings.townId, towns.id))
      .where(eq(towns.playerId, playerId))
    const first = rows[0]
    if (first === undefined) {
      return ok(undefined)
    }
    return townFrom(first.town, rows)
  }

  async save(town: Town): Promise<Result<void, DomainError>> {
    const { id, ...changes } = rowOf(town)
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
