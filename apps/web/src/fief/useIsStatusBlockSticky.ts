import { useSyncExternalStore } from 'react'
import { breakpoints } from '../design/tokens'

const stickyQuery = `(min-width: ${breakpoints.md})`

const stickyMediaOf = (): MediaQueryList | undefined =>
  typeof window.matchMedia === 'function' ? window.matchMedia(stickyQuery) : undefined

const subscribe = (onChange: () => void): (() => void) => {
  const media = stickyMediaOf()
  media?.addEventListener('change', onChange)
  return () => media?.removeEventListener('change', onChange)
}

const isStickyNow = (): boolean => stickyMediaOf()?.matches === true

export function useIsStatusBlockSticky(): boolean {
  return useSyncExternalStore(subscribe, isStickyNow, () => false)
}
