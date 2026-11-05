import { type DomainError, err, ok, type PlayerId, type Result } from '@mygame/domain'
import type { SiteAddress, Town, TownRepository } from '@mygame/domain/town'

const siteOf = ({ address: { region, area, site } }: Town): SiteAddress => ({ region, area, site })

const isSameSite = (left: SiteAddress, right: SiteAddress): boolean =>
  left.region === right.region && left.area === right.area && left.site === right.site

export class MemoryTownRepository implements TownRepository {
  private readonly towns = new Map<string, Town>()

  async holdsTown(playerId: PlayerId): Promise<boolean> {
    return this.townHeldBy(playerId) !== undefined
  }

  async occupiedSites(): Promise<ReadonlyArray<SiteAddress>> {
    return [...this.towns.values()].map(siteOf)
  }

  async townOf(playerId: PlayerId): Promise<Result<Town | undefined, DomainError>> {
    return ok(this.townHeldBy(playerId))
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
