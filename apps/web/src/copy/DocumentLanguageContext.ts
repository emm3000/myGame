import { createContext } from 'react'
import type { LineLanguage } from '../design-system/Label'

export const DocumentLanguageContext = createContext<
  ((language: LineLanguage) => void) | undefined
>(undefined)
