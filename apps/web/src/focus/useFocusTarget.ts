import { type RefObject, useCallback, useRef } from 'react'

export interface FocusTarget<Element extends HTMLElement> {
  readonly ref: RefObject<Element | null>
  readonly focus: () => void
}

export function useFocusTarget<Element extends HTMLElement>(): FocusTarget<Element> {
  const ref = useRef<Element>(null)
  const focus = useCallback((): void => ref.current?.focus(), [])
  return { ref, focus }
}
