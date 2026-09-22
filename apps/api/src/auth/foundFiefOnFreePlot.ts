import {
  type DomainError,
  type Fief,
  type FoundFiefCommand,
  type FoundFiefDependencies,
  foundFief,
  type Result,
} from '@mygame/domain'

const foundingAttempts = 3

const foundWithin = async (
  command: FoundFiefCommand,
  dependencies: FoundFiefDependencies,
  attemptsLeft: number,
): Promise<Result<Fief, DomainError>> => {
  const founded = await foundFief(command, dependencies)
  if (founded.ok || founded.error.kind !== 'CoordinatesTaken' || attemptsLeft <= 1) {
    return founded
  }
  return foundWithin(command, dependencies, attemptsLeft - 1)
}

export const foundFiefOnFreePlot = (
  command: FoundFiefCommand,
  dependencies: FoundFiefDependencies,
): Promise<Result<Fief, DomainError>> => foundWithin(command, dependencies, foundingAttempts)
