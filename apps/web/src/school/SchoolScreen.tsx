import {
  namesPlacesSchool,
  schoolLearning,
  schoolLearningFull,
  schoolLessonTitle,
  schoolSkills,
  schoolSkillsNone,
  schoolSlotDone,
  schoolSlotIdle,
  schoolSlotRefund,
  schoolSlotStop,
  schoolSlotStopOf,
  schoolSlotTitle,
  townLevel,
  townWorkReady,
} from '@mygame/catalog'
import { type ReactElement, useEffect, useState } from 'react'
import { BuildSlot, type BuildSlotState } from '../design-system/BuildSlot'
import { FormAlert } from '../design-system/FormAlert'
import { Track } from '../design-system/Track'
import { useFocusTarget } from '../focus/useFocusTarget'
import { refusalLineOf } from '../refusals/refusalLineOf'
import { formatFinish } from '../time/formatFinish'
import type { LiveTown } from '../town/liveTown'
import { NextStepLink } from '../town/NextStepLink'
import { reviewsActionOf } from '../town/nextStepCardOf'
import { LessonRows } from './LessonRows'
import {
  isPastLearningCap,
  type LessonCardContent,
  lessonCardOf,
  lessonNumberOf,
  readWordsLabelOf,
} from './lessonCardOf'
import { SchoolNextStep } from './SchoolNextStep'
import { ShownLesson } from './ShownLesson'
import { SkillList } from './SkillList'
import type { SchoolLessons } from './useSchoolLessons'

export interface SchoolScreenProps {
  readonly town: LiveTown
  readonly lessons: SchoolLessons
}

function slotStateOf(
  town: LiveTown,
  lessons: SchoolLessons,
  onStopped: () => void,
): BuildSlotState {
  const slot = town.lessonSlot
  if (slot === null) {
    return { kind: 'idle', title: schoolSlotTitle(), invitation: schoolSlotIdle() }
  }
  const number = lessonNumberOf(slot.lessonId, town.overview)
  const lesson = { buildingName: schoolLessonTitle({ number }), levelLabel: undefined }
  if (slot.remainingSeconds <= 0) {
    return { kind: 'justFinished', title: schoolSlotTitle(), message: schoolSlotDone(), ...lesson }
  }
  return {
    kind: 'busy',
    title: schoolSlotTitle(),
    remainingSeconds: slot.remainingSeconds,
    time: formatFinish(slot.remainingSeconds, town.at),
    totalSeconds: slot.totalSeconds,
    finishedLabel: townWorkReady(),
    cancel: {
      label: schoolSlotStop(),
      accessibleName: schoolSlotStopOf({ number }),
      isWaiting: lessons.isStopping,
      onCancel: () => lessons.stop(slot.lessonId, onStopped),
    },
    refund: schoolSlotRefund(),
    ...lesson,
  }
}

function LearningLoad({ town }: { readonly town: LiveTown }): ReactElement {
  const { learning } = town.overview
  const next = town.overview.lessons.find(
    (lesson) => !lesson.isStudied && town.overview.lessonSlot?.lessonId !== lesson.id,
  )
  return (
    <section className="flex flex-col gap-2 rounded-md border border-line bg-surface-raised p-5">
      <p className="m-0 font-sans text-body text-ink">
        {schoolLearning({ inLearning: learning.inLearning, cap: learning.cap })}
      </p>
      <Track value={learning.inLearning} total={learning.cap} fillClass="fill-action" />
      {next !== undefined && isPastLearningCap(next, town.overview) && (
        <p className="m-0 font-sans text-caption text-warning-ink">
          {schoolLearningFull({ count: next.words.length })}
        </p>
      )}
    </section>
  )
}

function ReviewsLink({
  town,
  shownLessonId,
}: {
  readonly town: LiveTown
  readonly shownLessonId: string
}): ReactElement | null {
  const { overview } = town
  const { nextStep } = overview
  if (nextStep.kind !== 'reviews') {
    return null
  }
  const action = reviewsActionOf(nextStep.readFirst)
  const named =
    action.to === '/school/$lessonId'
      ? { ...action, label: readWordsLabelOf(action.lessonId, shownLessonId, overview) }
      : action
  return <NextStepLink action={named} tone="quiet" />
}

const shownCardOf = (
  cards: ReadonlyArray<LessonCardContent>,
  selectedId: string | undefined,
): LessonCardContent | undefined => {
  const unstudied = cards.filter(({ state }) => state.kind !== 'studied')
  return (
    unstudied.find(({ lessonId }) => lessonId === selectedId) ??
    unstudied.find(({ state }) => state.kind === 'open') ??
    unstudied[0]
  )
}

export function SchoolScreen({ town, lessons }: SchoolScreenProps): ReactElement {
  const { overview } = town
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined)
  const blockTitle = useFocusTarget<HTMLHeadingElement>()
  const slotTitle = useFocusTarget<HTMLSpanElement>()
  const focusBlockTitle = blockTitle.focus
  useEffect(() => {
    if (selectedId !== undefined) {
      focusBlockTitle()
    }
  }, [selectedId, focusBlockTitle])
  const cards = overview.lessons.map((lesson) => lessonCardOf(lesson, overview))
  const shown = shownCardOf(cards, selectedId)
  const stopRefused = lessons.stopRefused
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h1 className="m-0 font-sans text-display text-ink">{namesPlacesSchool()}</h1>
        <p className="m-0 font-sans text-caption text-ink-muted tabular-nums">
          {townLevel({ level: overview.buildings.school.level })}
        </p>
      </header>
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-6">
          {shown === undefined ? (
            <SchoolNextStep town={town} />
          ) : (
            <ShownLesson card={shown} town={town} lessons={lessons} titleRef={blockTitle.ref} />
          )}
          <LearningLoad town={town} />
          {shown !== undefined && <ReviewsLink town={town} shownLessonId={shown.lessonId} />}
        </div>
        <div className="flex min-w-0 flex-col gap-6">
          <LessonRows
            cards={cards.filter(({ lessonId }) => lessonId !== shown?.lessonId)}
            onSelect={setSelectedId}
          />
          <BuildSlot state={slotStateOf(town, lessons, slotTitle.focus)} titleRef={slotTitle.ref} />
          {stopRefused !== undefined && (
            <FormAlert message={refusalLineOf(stopRefused.refusal, stopRefused.error)} />
          )}
          <SkillList skills={overview.skills} title={schoolSkills()} empty={schoolSkillsNone()} />
        </div>
      </div>
    </div>
  )
}
