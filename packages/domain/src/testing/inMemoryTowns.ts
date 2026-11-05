import type { PlayerId } from '../player/PlayerId'
import { err, ok } from '../Result'
import type { Town } from '../town/Town'
import type { TownRepository } from '../town/TownRepository'

export type InMemoryTowns = TownRepository & {
  readonly storedTownOf: (playerId: PlayerId) => Town | undefined
}

const isSameSite = (left: Town, right: Town): boolean =>
  left.address.region === right.address.region &&
  left.address.area === right.address.area &&
  left.address.site === right.address.site

export const inMemoryTowns = (seed: ReadonlyArray<Town>): InMemoryTowns => {
  const towns = new Map(seed.map((town) => [town.id, town]))
  const townHeldBy = (playerId: PlayerId): Town | undefined =>
    [...towns.values()].find((town) => town.playerId === playerId)
  return {
    holdsTown: async (playerId) => townHeldBy(playerId) !== undefined,
    occupiedSites: async () =>
      [...towns.values()].map(({ address: { region, area, site } }) => ({ region, area, site })),
    townOf: async (playerId) => ok(townHeldBy(playerId)),
    save: async (town) => {
      const others = [...towns.values()].filter((stored) => stored.id !== town.id)
      if (others.some((stored) => stored.playerId === town.playerId)) {
        return err({ kind: 'PlayerAlreadyHoldsTown', playerId: town.playerId })
      }
      const { region, area, site } = town.address
      if (others.some((stored) => isSameSite(stored, town))) {
        return err({ kind: 'SiteTaken', site: { region, area, site } })
      }
      towns.set(town.id, town)
      return ok(undefined)
    },
    storedTownOf: townHeldBy,
  }
}
