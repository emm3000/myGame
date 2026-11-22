import type { PlayerId } from '#player/PlayerId'
import { err, ok } from '#Result'
import type { EarnedSkillRepository } from '../ports/EarnedSkillRepository'
import type { TownRepository } from '../ports/TownRepository'
import { Town } from '../Town'

export type InMemoryTowns = TownRepository & {
  readonly storedTownOf: (playerId: PlayerId) => Town | undefined
}

const isSameSite = (left: Town, right: Town): boolean =>
  left.address.region === right.address.region &&
  left.address.area === right.address.area &&
  left.address.site === right.address.site

export const inMemoryTowns = (
  seed: ReadonlyArray<Town>,
  skills: EarnedSkillRepository,
): InMemoryTowns => {
  const towns = new Map(seed.map((town) => [town.id, town]))
  const townHeldBy = (playerId: PlayerId): Town | undefined =>
    [...towns.values()].find((town) => town.playerId === playerId)
  return {
    holdsTown: async (playerId) => townHeldBy(playerId) !== undefined,
    occupiedSites: async () =>
      [...towns.values()].map(({ address: { region, area, site } }) => ({ region, area, site })),
    townOf: async (playerId) => {
      const town = townHeldBy(playerId)
      if (town === undefined) {
        return ok(undefined)
      }
      const earned = await skills.skillsOf(playerId)
      if (!earned.ok) {
        return earned
      }
      const { id, name, address, stocks, storedAt, fullSince, buildingLevels } = town
      return Town.restore({
        id,
        playerId,
        name,
        address,
        stocks,
        storedAt,
        fullSince,
        buildingLevels,
        workSlot: town.workSlot,
        waitingList: town.waitingList,
        hires: town.hires,
        hiringSlot: town.hiringSlot,
        jobSlot: town.jobSlot,
        skills: earned.value,
      })
    },
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
