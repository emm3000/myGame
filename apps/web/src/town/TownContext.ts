import { createContext } from 'react'
import type { TownHandle } from './useTown'

export const TownContext = createContext<TownHandle | undefined>(undefined)
