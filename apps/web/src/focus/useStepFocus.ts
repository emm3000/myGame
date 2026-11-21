import { type RefCallback, useCallback, useEffect, useRef } from 'react'
import { useFocusTarget } from './useFocusTarget'

export interface StepFocus {
  readonly ref: RefCallback<HTMLElement>
  readonly focus: () => void
}

export function useStepFocus(step: string | undefined): StepFocus {
  const target = useFocusTarget<HTMLElement>()
  const shownStep = useRef(step)
  const targetRef = target.ref
  const ref = useCallback(
    (element: HTMLElement | null): void => {
      targetRef.current = element
    },
    [targetRef],
  )
  const { focus } = target
  useEffect(() => {
    const previous = shownStep.current
    shownStep.current = step
    if (previous !== undefined && previous !== step) {
      focus()
    }
  }, [step, focus])
  return { ref, focus }
}
