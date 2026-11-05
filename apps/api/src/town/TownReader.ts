import type { TownRepository } from '@mygame/domain/town'

export type TownReader = Omit<TownRepository, 'save'>
