import type { TownOverview } from '@mygame/contracts/town'
import { useCallback, useEffect, useRef, useState } from 'react'
import { lessonFinishedBetween } from './lessonFinishedBetween'

export interface LessonFinish {
  readonly lessonId: string | undefined
  readonly sequence: number
  readonly noticeReadFirst: ReadonlyArray<string> | undefined
  readonly close: () => void
}

interface Announced {
  readonly lessonId: string | undefined
  readonly sequence: number
}

const isDoorToReviews = (pathname: string, [firstUnread]: ReadonlyArray<string>): boolean =>
  pathname === '/reviews' || pathname === `/school/${firstUnread}`

const readFirstOf = (overview: TownOverview | undefined): ReadonlyArray<string> | undefined =>
  overview?.nextStep.kind === 'reviews' ? overview.nextStep.readFirst : undefined

export function useLessonFinish(
  overview: TownOverview | undefined,
  pathname: string,
): LessonFinish {
  const [announced, setAnnounced] = useState<Announced>({ lessonId: undefined, sequence: 0 })
  const [isOpen, setIsOpen] = useState(false)
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
      setAnnounced(({ sequence }) => ({ lessonId, sequence: sequence + 1 }))
      setIsOpen(true)
    }
  }, [overview])

  const readFirst = readFirstOf(overview)
  const isDone = readFirst === undefined || isDoorToReviews(pathname, readFirst)

  useEffect(() => {
    if (isDone) {
      setIsOpen(false)
    }
  }, [isDone])

  const close = useCallback((): void => setIsOpen(false), [])

  return { ...announced, noticeReadFirst: isOpen && !isDone ? readFirst : undefined, close }
}
