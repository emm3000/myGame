import type { TownRepository } from './TownRepository'

export type ReadOnlyTowns = Omit<TownRepository, 'save'>
