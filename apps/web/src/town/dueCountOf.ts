import type { LiveTown } from './liveTown'

export const dueCountOf = (town: LiveTown | undefined): number =>
  town?.overview.nextStep.kind === 'reviews' ? town.overview.nextStep.count : 0
