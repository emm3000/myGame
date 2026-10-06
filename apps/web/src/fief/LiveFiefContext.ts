import { createContext } from 'react'
import type { LiveFiefHandle } from './useLiveFief'

export const LiveFiefContext = createContext<LiveFiefHandle | undefined>(undefined)
