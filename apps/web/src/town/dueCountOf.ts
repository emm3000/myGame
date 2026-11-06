import type { LiveTown } from './liveTown'

export const dueCountOf = ({ overview }: LiveTown): number =>
  overview.nextStep.kind === 'reviews' ? overview.nextStep.count : 0
