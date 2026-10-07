import type { FiefOverview } from '@mygame/contracts'
import { useCallback, useState } from 'react'
import { finishNoticesOf } from './finishNoticesOf'

export interface FinishAnnouncementHandle {
  readonly line: string
  readonly announceBetween: (previous: FiefOverview, next: FiefOverview) => void
}

export function useFinishAnnouncement(): FinishAnnouncementHandle {
  const [line, setLine] = useState('')

  const announceBetween = useCallback((previous: FiefOverview, next: FiefOverview): void => {
    setLine(
      finishNoticesOf(previous, next)
        .map(({ body }) => body)
        .join(' '),
    )
  }, [])

  return { line, announceBetween }
}
