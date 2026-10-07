import { useContext } from 'react'
import type { FocusTarget } from '../focus/useFocusTarget'
import { FiefNameContext } from './FiefNameContext'

export function useFiefNameTarget(): FocusTarget<HTMLHeadingElement> {
  const target = useContext(FiefNameContext)
  if (target === undefined) {
    throw new Error('useFiefNameTarget needs the fief layout above it')
  }
  return target
}
