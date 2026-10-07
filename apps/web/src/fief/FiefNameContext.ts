import { createContext } from 'react'
import type { FocusTarget } from '../focus/useFocusTarget'

export const FiefNameContext = createContext<FocusTarget<HTMLHeadingElement> | undefined>(undefined)
