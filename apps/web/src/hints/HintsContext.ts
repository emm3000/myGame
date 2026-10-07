import { createContext } from 'react'
import type { HintsHandle } from './useHints'

export const HintsContext = createContext<HintsHandle | undefined>(undefined)
