import type { TownOverview } from '@mygame/contracts/town'
import { useCallback, useEffect, useRef, useState } from 'react'
import { lessonFinishedBetween } from './lessonFinishedBetween'

export interface LessonFinish {
  readonly lessonId: string | undefined
  readonly sequence: number
  readonly close: () => void
}

interface Finished {
  readonly lessonId: string | undefined
  readonly sequence: number
}

export function useLessonFinish(overview: TownOverview | undefined): LessonFinish {
  const [finished, setFinished] = useState<Finished>({ lessonId: undefined, sequence: 0 })
  const heldOverview = useRef(overview)

  useEffect(() => {
    if (overview === undefined) {
      return
    }
    const lessonId =
      heldOverview.current === undefined
        ? undefined
        : lessonFinishedBetween(heldOverview.current, overview)
    heldOverview.current = overview
    if (lessonId !== undefined) {
      setFinished(({ sequence }) => ({ lessonId, sequence: sequence + 1 }))
    }
  }, [overview])

  const close = useCallback((): void => {
    setFinished(({ sequence }) => ({ lessonId: undefined, sequence }))
  }, [])

  return { ...finished, close }
}
