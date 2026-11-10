import {
  type DomainError,
  type FoundTownCommand,
  type FoundTownDependencies,
  foundTown,
  type Result,
  type Town,
} from '@mygame/domain'

const foundingAttempts = 3

const foundWithin = async (
  command: FoundTownCommand,
  dependencies: FoundTownDependencies,
  attemptsLeft: number,
): Promise<Result<Town, DomainError>> => {
  const founded = await foundTown(command, dependencies)
  if (founded.ok || founded.error.kind !== 'SiteTaken' || attemptsLeft <= 1) {
    return founded
  }
  return foundWithin(command, dependencies, attemptsLeft - 1)
}

export const foundTownOnFreeSite = (
  command: FoundTownCommand,
  dependencies: FoundTownDependencies,
): Promise<Result<Town, DomainError>> => foundWithin(command, dependencies, foundingAttempts)
