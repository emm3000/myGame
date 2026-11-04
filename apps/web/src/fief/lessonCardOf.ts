import { copy } from '../copy'
import type { CardActionState } from '../design-system/CardAction'
import { formatFinish } from '../time/formatFinish'
import type { LessonCardState } from './LessonCard'
import type { LiveFief } from './liveFief'

type LessonState = LiveFief['overview']['lessons'][number]

function actionOf(fief: LiveFief): CardActionState {
  if (fief.overview.study.kind === 'idle') {
    return { kind: 'affordable' }
  }
  return { kind: 'blocked', reason: copy.study.studyRunning }
}

export function lessonCardOf(lesson: LessonState, fief: LiveFief): LessonCardState {
  if (lesson.isStudied) {
    return { kind: 'studied' }
  }
  const { study } = fief.overview
  if (study.kind === 'lesson' && study.lessonId === lesson.id) {
    return { kind: 'underStudy', time: formatFinish(fief.studyRemainingSeconds, fief.at) }
  }
  return { kind: 'idle', action: actionOf(fief), wordCount: lesson.words.length }
}
