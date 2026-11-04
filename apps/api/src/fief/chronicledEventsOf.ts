import { type DomainError, err, type FiefEvent, ok, type Result } from '@mygame/domain'

type LessonEvent = Extract<FiefEvent, { readonly kind: 'lessonLearned' | 'lessonCancelled' }>

export type ChronicledEvent = Exclude<FiefEvent, LessonEvent>

const isLessonEvent = (event: FiefEvent): event is LessonEvent =>
  event.kind === 'lessonLearned' || event.kind === 'lessonCancelled'

export const chronicledEventsOf = (
  events: ReadonlyArray<FiefEvent>,
): Result<ReadonlyArray<ChronicledEvent>, DomainError> => {
  const chronicled: Array<ChronicledEvent> = []
  for (const event of events) {
    if (isLessonEvent(event)) {
      return err({ kind: 'LessonNotStored', lessonId: event.lessonId })
    }
    chronicled.push(event)
  }
  return ok(chronicled)
}
