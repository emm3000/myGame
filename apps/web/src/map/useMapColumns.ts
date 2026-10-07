import { useSyncExternalStore } from 'react'
import { breakpoints } from '../design/tokens'

const wideQuery = `(min-width: ${breakpoints.lg})`
const narrowColumns = 2
const wideColumns = 5

const wideMediaOf = (): MediaQueryList | undefined =>
  typeof window.matchMedia === 'function' ? window.matchMedia(wideQuery) : undefined

const subscribe = (onChange: () => void): (() => void) => {
  const media = wideMediaOf()
  media?.addEventListener('change', onChange)
  return () => media?.removeEventListener('change', onChange)
}

const columnsNow = (): number => (wideMediaOf()?.matches === true ? wideColumns : narrowColumns)

export function useMapColumns(): number {
  return useSyncExternalStore(subscribe, columnsNow, () => narrowColumns)
}
