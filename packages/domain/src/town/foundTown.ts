import type { DomainError } from '../DomainError'
import { lowestFreeCell } from '../grid/lowestFreeCell'
import type { PlayerId } from '../player/PlayerId'
import type { Clock } from '../ports/Clock'
import type { IdGenerator } from '../ports/IdGenerator'
import { err, ok, type Result } from '../Result'
import type { EarnedSkillRepository } from './EarnedSkillRepository'
import { Town } from './Town'
import { TownAddress } from './TownAddress'
import type { TownCatalog } from './TownCatalog'
import { TownName } from './TownName'
import type { TownRepository } from './TownRepository'

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
