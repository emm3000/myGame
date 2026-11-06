import {
  namesPlacesSchool,
  schoolLearning,
  schoolLearningFull,
  schoolLessonReadWords,
  schoolLessonStudied,
  schoolLessonStudying,
  schoolLessons,
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
import { type ReactElement, useId } from 'react'
import { BuildSlot, type BuildSlotState } from '../design-system/BuildSlot'
import { ButtonLink } from '../design-system/ButtonLink'
import { CardAction, cardToneOf } from '../design-system/CardAction'
import { FormAlert } from '../design-system/FormAlert'
import { formatDuration } from '../design-system/formatDuration'
import { Panel } from '../design-system/Panel'
import { Track } from '../design-system/Track'
import { useFocusTarget } from '../focus/useFocusTarget'
import { refusalLineOf } from '../refusals/refusalLineOf'
import { formatFinish } from '../time/formatFinish'
import type { LiveTown } from '../town/liveTown'
import {
  isPastLearningCap,
  type LessonCardContent,
  lessonCardOf,
  lessonNumberOf,
} from './lessonCardOf'
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

function LessonStatus({ label }: { readonly label: string }): ReactElement {
  return (
    <span className="self-start rounded-pill bg-surface-sunken px-2 font-sans text-label text-ink">
      {label}
    </span>
  )
}

function LessonAction({
  card,
  lessons,
}: {
  readonly card: LessonCardContent
  readonly lessons: SchoolLessons
}): ReactElement {
  switch (card.state.kind) {
    case 'studied':
      return <LessonStatus label={schoolLessonStudied()} />
    case 'studying':
      return <LessonStatus label={schoolLessonStudying()} />
    case 'open':
      return (
        <CardAction
          type="button"
          label={`${card.actionLabel} · ${formatDuration(card.durationSeconds)}`}
          state={card.state.action}
          isWaiting={lessons.isStarting}
          onAction={() => lessons.start(card.lessonId)}
        />
      )
    default: {
      const unreachable: never = card.state
      return unreachable
    }
  }
}

function LessonItem({
  card,
  lessons,
}: {
  readonly card: LessonCardContent
  readonly lessons: SchoolLessons
}): ReactElement {
  const refused = lessons.startRefused?.subject === card.lessonId ? lessons.startRefused : undefined
  const tone =
    card.state.kind === 'open' ? cardToneOf(card.state.action) : 'border-line bg-surface-sunken'
  return (
    <li aria-label={card.title} className="flex flex-col gap-2">
      <Panel element="article" toneClass={tone} spacingClass="gap-3 p-5">
        <h4 className="m-0 font-sans text-title text-ink">{card.title}</h4>
        <p lang="en" className="m-0 font-sans text-reading text-ink">
          {card.theme}
        </p>
        <p className="m-0 font-sans text-caption text-ink-muted">
          {card.wordsLine} · {card.skillLine}
        </p>
        <LessonAction card={card} lessons={lessons} />
      </Panel>
      {refused !== undefined && (
        <FormAlert message={refusalLineOf(refused.refusal, refused.error)} />
      )}
    </li>
  )
}

export function SchoolScreen({ town, lessons }: SchoolScreenProps): ReactElement {
  const { overview } = town
  const lessonsTitleId = useId()
  const slotTitle = useFocusTarget<HTMLSpanElement>()
  const stopRefused = lessons.stopRefused
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 className="m-0 font-sans text-display text-ink">{namesPlacesSchool()}</h2>
        <span className="rounded-pill border border-line-strong bg-surface-raised px-2 font-sans text-label text-ink">
          {townLevel({ level: overview.buildings.school.level })}
        </span>
      </header>
      <div className="grid items-start gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-4">
          <LearningLoad town={town} />
          <BuildSlot state={slotStateOf(town, lessons, slotTitle.focus)} titleRef={slotTitle.ref} />
          {town.lessonSlot !== null && (
            <div>
              <ButtonLink
                to="/school/$lessonId"
                params={{ lessonId: town.lessonSlot.lessonId }}
                tone="primary"
              >
                {schoolLessonReadWords()}
              </ButtonLink>
            </div>
          )}
          {stopRefused !== undefined && (
            <FormAlert message={refusalLineOf(stopRefused.refusal, stopRefused.error)} />
          )}
          <SkillList skills={overview.skills} title={schoolSkills()} empty={schoolSkillsNone()} />
        </div>
        <section aria-labelledby={lessonsTitleId} className="flex flex-col gap-3 lg:col-span-2">
          <h3 id={lessonsTitleId} className="m-0 font-sans text-heading text-ink">
            {schoolLessons()}
          </h3>
          <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2">
            {overview.lessons.map((lesson) => (
              <LessonItem key={lesson.id} card={lessonCardOf(lesson, overview)} lessons={lessons} />
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}
