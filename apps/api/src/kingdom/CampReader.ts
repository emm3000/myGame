import type { CampRegistry } from '@mygame/domain'

export type CampReader = Omit<CampRegistry, 'record'>
