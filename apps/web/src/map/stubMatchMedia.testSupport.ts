import { vi } from 'vitest'

export interface MatchMediaStub {
  readonly matchAll: (isMatching: boolean) => void
}

export function stubMatchMedia(isMatching: boolean): MatchMediaStub {
  let matches = isMatching
  const listeners = new Set<EventListener>()
  vi.stubGlobal(
    'matchMedia',
    (query: string): MediaQueryList =>
      ({
        get matches() {
          return matches
        },
        media: query,
        onchange: null,
        addEventListener: (_type: string, listener: EventListener) => {
          listeners.add(listener)
        },
        removeEventListener: (_type: string, listener: EventListener) => {
          listeners.delete(listener)
        },
        addListener: () => undefined,
        removeListener: () => undefined,
        dispatchEvent: () => false,
      }) as MediaQueryList,
  )
  return {
    matchAll: (isNowMatching) => {
      matches = isNowMatching
      for (const listener of listeners) {
        listener(new Event('change'))
      }
    },
  }
}
