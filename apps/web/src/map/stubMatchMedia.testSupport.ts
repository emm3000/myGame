import { vi } from 'vitest'

export function stubMatchMedia(isMatching: (query: string) => boolean): void {
  vi.stubGlobal(
    'matchMedia',
    (query: string): MediaQueryList =>
      ({
        matches: isMatching(query),
        media: query,
        onchange: null,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        addListener: () => undefined,
        removeListener: () => undefined,
        dispatchEvent: () => false,
      }) as MediaQueryList,
  )
}
