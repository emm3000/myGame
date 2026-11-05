import type { FiefRepository } from '@mygame/domain'

export type FiefReader = Omit<FiefRepository, 'save'>
