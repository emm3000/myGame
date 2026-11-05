import type { TownOverview } from '@mygame/contracts/town'
import type { ApiClient } from '../api/apiClient'
import { type RefusedTownAction, useTownAction } from '../town/useTownAction'

export interface SchoolLessons {
  readonly isStarting: boolean
  readonly startRefused: RefusedTownAction<string> | undefined
  readonly start: (lessonId: string) => void
  readonly isStopping: boolean
  readonly stopRefused: RefusedTownAction<string> | undefined
  readonly stop: (lessonId: string, onStopped: () => void) => void
}

export function useSchoolLessons(
  apiClient: ApiClient,
  adopt: (overview: TownOverview) => void,
  readAt: string,
): SchoolLessons {
  const starting = useTownAction<string>(adopt, readAt)
  const stopping = useTownAction<string>(adopt, readAt)
  return {
    isStarting: starting.isWaiting,
    startRefused: starting.refused,
    start: (lessonId) => starting.run(lessonId, () => apiClient.startLesson(lessonId)),
    isStopping: stopping.isWaiting,
    stopRefused: stopping.refused,
    stop: (lessonId, onStopped) =>
      stopping.run(lessonId, () => apiClient.stopLesson(lessonId), onStopped),
  }
}
