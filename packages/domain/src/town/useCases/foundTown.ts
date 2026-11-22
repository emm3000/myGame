import type { DomainError } from '#DomainError'
import { lowestFreeCell } from '#grid/lowestFreeCell'
import type { Clock } from '#platform/domain/Clock'
import type { IdGenerator } from '#platform/domain/IdGenerator'
import type { PlayerId } from '#player/PlayerId'
import { err, ok, type Result } from '#Result'
import type { EarnedSkillRepository } from '../domain/EarnedSkillRepository'
import { Town } from '../domain/Town'
import { TownAddress } from '../domain/TownAddress'
import type { TownCatalog } from '../domain/TownCatalog'
import { TownName } from '../domain/TownName'
import type { TownRepository } from '../domain/TownRepository'

const FIRST_REGION = 1

export type FoundTownCommand = {
  readonly playerId: PlayerId
  readonly name: string
}

export type FoundTownDependencies = {
  readonly towns: TownRepository
  readonly catalog: TownCatalog
  readonly clock: Clock
  readonly ids: IdGenerator
  readonly skills: EarnedSkillRepository
}

const lowestFreeAddress = async (
  towns: TownRepository,
  sitesPerArea: number,
): Promise<Result<TownAddress, DomainError>> => {
  const takenSites = (await towns.occupiedSites())
    .filter(({ region }) => region === FIRST_REGION)
    .map(({ area, site }) => ({ row: area, column: site }))
  const lowestFree = lowestFreeCell(takenSites, sitesPerArea)
  if (!lowestFree.ok) {
    return lowestFree
  }
  return TownAddress.create(FIRST_REGION, lowestFree.value.row, lowestFree.value.column)
}

export const foundTown = async (
  command: FoundTownCommand,
  { towns, catalog, clock, ids, skills }: FoundTownDependencies,
): Promise<Result<Town, DomainError>> => {
  const name = TownName.create(command.name)
  if (!name.ok) {
    return name
  }
  if (await towns.holdsTown(command.playerId)) {
    return err({ kind: 'PlayerAlreadyHoldsTown', playerId: command.playerId })
  }
  const settings = catalog.townSettings()
  const address = await lowestFreeAddress(towns, settings.sitesPerArea)
  if (!address.ok) {
    return address
  }
  const earned = await skills.skillsOf(command.playerId)
  if (!earned.ok) {
    return earned
  }
  const town = Town.found({
    id: ids.newId(),
    playerId: command.playerId,
    name: name.value,
    address: address.value,
    startingStocks: settings.startingStocks,
    skills: earned.value,
    at: clock.now(),
  })
  const saved = await towns.save(town)
  if (!saved.ok) {
    return saved
  }
  return ok(town)
}
