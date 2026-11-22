import type { DomainError } from '#DomainError'
import { lowestFreeCell } from '#grid/lowestFreeCell'
import type { Clock } from '#platform/domain/Clock'
import type { IdGenerator } from '#platform/domain/IdGenerator'
import type { UnitOfWork } from '#platform/domain/UnitOfWork'
import type { PlayerId } from '#player/PlayerId'
import { err, ok, type Result } from '#Result'
import type { EarnedSkillRepository } from '../domain/EarnedSkillRepository'
import { Town } from '../domain/Town'
import { TownAddress } from '../domain/TownAddress'
import type { TownCatalog } from '../domain/TownCatalog'
import { TownName } from '../domain/TownName'
import type { TownReading } from '../domain/TownReading'
import type { TownRepository } from '../domain/TownRepository'
import type { TownStores } from '../domain/TownStores'
import { readTownReading } from './readTownReading'

const FIRST_REGION = 1

const foundingAttempts = 3

export type FoundTownCommand = {
  readonly playerId: PlayerId
  readonly name: string
}

export type FoundTownDependencies = {
  readonly unitOfWork: UnitOfWork<TownStores>
  readonly townCatalog: TownCatalog
  readonly clock: Clock
  readonly ids: IdGenerator
}

type FoundingStores = {
  readonly towns: TownRepository
  readonly earnedSkills: EarnedSkillRepository
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

const foundOnce = async (
  command: FoundTownCommand,
  { towns, earnedSkills }: FoundingStores,
  { townCatalog, clock, ids }: FoundTownDependencies,
): Promise<Result<Town, DomainError>> => {
  const name = TownName.create(command.name)
  if (!name.ok) {
    return name
  }
  if (await towns.holdsTown(command.playerId)) {
    return err({ kind: 'PlayerAlreadyHoldsTown', playerId: command.playerId })
  }
  const settings = townCatalog.townSettings()
  const address = await lowestFreeAddress(towns, settings.sitesPerArea)
  if (!address.ok) {
    return address
  }
  const earned = await earnedSkills.skillsOf(command.playerId)
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
  return saved.ok ? ok(town) : saved
}

const foundWithin = async (
  command: FoundTownCommand,
  stores: FoundingStores,
  dependencies: FoundTownDependencies,
  attemptsLeft: number,
): Promise<Result<Town, DomainError>> => {
  const founded = await foundOnce(command, stores, dependencies)
  if (founded.ok || founded.error.kind !== 'SiteTaken' || attemptsLeft <= 1) {
    return founded
  }
  return foundWithin(command, stores, dependencies, attemptsLeft - 1)
}

export class FoundTown {
  constructor(private readonly dependencies: FoundTownDependencies) {}

  async execute(command: FoundTownCommand): Promise<Result<TownReading, DomainError>> {
    return this.dependencies.unitOfWork.transact(async (stores) => {
      const town = await foundWithin(command, stores, this.dependencies, foundingAttempts)
      return town.ok
        ? readTownReading(command.playerId, town.value.storedAt, stores.townsWithSchool)
        : town
    })
  }
}
