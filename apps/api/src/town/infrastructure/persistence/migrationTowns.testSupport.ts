import type { Client } from 'pg'

export const insertTownOf = async (
  client: Client,
  playerId: string,
  site: number,
  stocks: { readonly money: number; readonly food: number },
): Promise<void> => {
  await client.query(
    `INSERT INTO towns (id, player_id, region, area, site, name, money, food, power, material, stored_at)
     VALUES (gen_random_uuid(), $1, 1, 1, $2, 'Maple Hill', $3, $4, 0, 0, '2026-11-04T08:00:00Z')`,
    [playerId, site, stocks.money, stocks.food],
  )
}

export const plainStocks = { money: 400, food: 300 }
