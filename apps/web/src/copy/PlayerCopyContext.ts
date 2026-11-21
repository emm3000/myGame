import { createContext } from 'react'
import type { PlayerCopy } from './PlayerCopy'

export const PlayerCopyContext = createContext<PlayerCopy | undefined>(undefined)
