import { en, es } from '@mygame/catalog'
import type { Scaffold } from '@mygame/domain'

export type FixedCopy = typeof en | typeof es

export const pickFixedCopy = (scaffold: Scaffold): FixedCopy => (scaffold === 'none' ? en : es)
