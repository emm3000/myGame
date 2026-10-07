import { vi } from 'vitest'

export interface ResizeObserverStub {
  readonly resizeTo: (isTarget: (target: Element) => boolean, blockSize: number) => void
  readonly observedCount: () => number
}

function entryOf(target: Element, blockSize: number): ResizeObserverEntry {
  const size = { blockSize, inlineSize: 0 }
  return {
    target,
    borderBoxSize: [size],
    contentBoxSize: [size],
    devicePixelContentBoxSize: [size],
    contentRect: {
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: 0,
      bottom: blockSize,
      width: 0,
      height: blockSize,
      toJSON: () => ({}),
    },
  }
}

export function stubResizeObserver(): ResizeObserverStub {
  const observers = new Set<Stub>()
  class Stub {
    readonly targets = new Set<Element>()
    constructor(readonly callback: ResizeObserverCallback) {}
    observe(target: Element): void {
      this.targets.add(target)
      observers.add(this)
    }
    unobserve(target: Element): void {
      this.targets.delete(target)
    }
    disconnect(): void {
      this.targets.clear()
      observers.delete(this)
    }
  }
  vi.stubGlobal('ResizeObserver', Stub)
  return {
    resizeTo: (isTarget, blockSize) => {
      for (const observer of observers) {
        const entries = [...observer.targets]
          .filter(isTarget)
          .map((target) => entryOf(target, blockSize))
        if (entries.length > 0) {
          observer.callback(entries, observer)
        }
      }
    },
    observedCount: () => [...observers].reduce((count, { targets }) => count + targets.size, 0),
  }
}
