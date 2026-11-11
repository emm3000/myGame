import {
  type DomainError,
  type EarnedSkillRepository,
  err,
  ok,
  type PlayerId,
  type Result,
  type SiteAddress,
  Town,
  type TownRepository,
} from '@mygame/domain'

const siteOf = ({ address: { region, area, site } }: Town): SiteAddress => ({ region, area, site })

const isSameSite = (left: SiteAddress, right: SiteAddress): boolean =>
  left.region === right.region && left.area === right.area && left.site === right.site

export class MemoryTownRepository implements TownRepository {
  private readonly towns = new Map<string, Town>()

  constructor(private readonly skills: EarnedSkillRepository) {}

  async holdsTown(playerId: PlayerId): Promise<boolean> {
    return this.townHeldBy(playerId) !== undefined
  }

  async occupiedSites(): Promise<ReadonlyArray<SiteAddress>> {
    return [...this.towns.values()].map(siteOf)
  }

  async townOf(playerId: PlayerId): Promise<Result<Town | undefined, DomainError>> {
    const town = this.townHeldBy(playerId)
    if (town === undefined) {
      return ok(undefined)
    }
    const skills = await this.skills.skillsOf(playerId)
    if (!skills.ok) {
      return skills
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
      skills: skills.value,
    })
  }

  async save(town: Town): Promise<Result<void, DomainError>> {
    const others = [...this.towns.values()].filter((stored) => stored.id !== town.id)
    if (others.some((stored) => stored.playerId === town.playerId)) {
      return err({ kind: 'PlayerAlreadyHoldsTown', playerId: town.playerId })
    }
    if (others.some((stored) => isSameSite(siteOf(stored), siteOf(town)))) {
      return err({ kind: 'SiteTaken', site: siteOf(town) })
    }
    this.towns.set(town.id, town)
    return ok(undefined)
  }

  private townHeldBy(playerId: PlayerId): Town | undefined {
    return [...this.towns.values()].find((town) => town.playerId === playerId)
  }
}
