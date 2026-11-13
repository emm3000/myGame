import { en, es } from '@mygame/catalog'
import type { Scaffold } from '@mygame/domain'

export type FixedCopy = typeof es

export const fixedCopyOf = (scaffold: Scaffold): FixedCopy => (scaffold === 'none' ? en : es)
