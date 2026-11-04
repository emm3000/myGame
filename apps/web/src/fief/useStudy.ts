import type {
  ArtKind,
  CancelLessonRequest,
  CancelStudyRequest,
  FiefOverview,
} from '@mygame/contracts'
import type { ApiClient, ApiRefusal } from '../api/apiClient'
import { useFiefAction } from './useFiefAction'

export interface Study {
  readonly isWaiting: boolean
  readonly refusal: ApiRefusal | undefined
  readonly start: (art: ArtKind) => void
  readonly cancel: (target: CancelStudyRequest, onCancelled: () => void) => void
  readonly startLesson: (lessonId: string) => void
  readonly cancelLesson: (lessonId: string, onCancelled: () => void) => void
}

type StudySubject = ArtKind | CancelStudyRequest | CancelLessonRequest

export function useStudy(
  apiClient: ApiClient,
  fiefId: string,
  adopt: (overview: FiefOverview) => void,
  readAt: string | undefined,
): Study {
  const { isWaiting, refused, run } = useFiefAction<StudySubject>(adopt, readAt)

  return {
    isWaiting,
    refusal: refused?.refusal,
    start: (art) => run(art, () => apiClient.startStudy(fiefId, art)),
    cancel: (target, onCancelled) =>
      run(target, () => apiClient.cancelStudy(fiefId, target), onCancelled),
    startLesson: (lessonId) => run({ lessonId }, () => apiClient.startLesson(fiefId, lessonId)),
    cancelLesson: (lessonId, onCancelled) =>
      run({ lessonId }, () => apiClient.cancelLesson(fiefId, lessonId), onCancelled),
  }
}
