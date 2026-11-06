import { useEffect, useRef } from 'react'
import type { TownState } from '../town/useTown'

export function useReportAtLessonFinish(town: TownState, reread: () => void): void {
  const isStudying = town.kind === 'live' && town.town.lessonSlot !== null
  const wasStudying = useRef(isStudying)
  useEffect(() => {
    if (wasStudying.current && !isStudying) {
      reread()
    }
    wasStudying.current = isStudying
  }, [isStudying, reread])
}
