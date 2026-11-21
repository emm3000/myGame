import type { TownRepository } from '@mygame/domain'

export type ReadOnlyTowns = Omit<TownRepository, 'save'>
