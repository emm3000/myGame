import type { FiefOverview } from '@mygame/contracts'
import { useCallback, useState } from 'react'
import { finishNoticesOf } from './finishNoticesOf'

export interface FinishAnnouncement {
  readonly line: string
  readonly sequence: number
}

export interface FinishAnnouncementHandle {
  readonly announcement: FinishAnnouncement
  readonly announceBetween: (previous: FiefOverview, next: FiefOverview) => void
}

export function useFinishAnnouncement(): FinishAnnouncementHandle {
  const [announcement, setAnnouncement] = useState<FinishAnnouncement>({ line: '', sequence: 0 })

  const announceBetween = useCallback((previous: FiefOverview, next: FiefOverview): void => {
    const line = finishNoticesOf(previous, next)
      .map(({ body }) => body)
      .join(' ')
    setAnnouncement(({ sequence }) => ({ line, sequence: sequence + 1 }))
  }, [])

  return { announcement, announceBetween }
}
