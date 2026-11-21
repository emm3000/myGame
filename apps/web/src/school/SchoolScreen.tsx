import type { NextStep } from '@mygame/contracts'
import { type ReactElement, useEffect, useState } from 'react'
import { chromeWithFiguresOf } from '../copy/chromeWithFiguresOf'
import type { PlayerCopy } from '../copy/PlayerCopy'
import { usePlayerCopy } from '../copy/usePlayerCopy'
import { BuildSlot, type BuildSlotState } from '../design-system/BuildSlot'
import { FormAlert } from '../design-system/FormAlert'
import type { Label } from '../design-system/Label'
import { LabelText } from '../design-system/LabelText'
import { Track } from '../design-system/Track'
import { useFocusTarget } from '../focus/useFocusTarget'
import { refusalLineOf } from '../refusals/refusalLineOf'
import { formatFinish } from '../time/formatFinish'
import { joinFinishPieces } from '../time/joinFinishPieces'
import { lessonNameOf } from '../town/lessonNameOf'
import type { LiveTown } from '../town/liveTown'
import { NextStepLink } from '../town/NextStepLink'
import { reviewsActionOf } from '../town/nextStepCardOf'
import { BandLines } from './BandLines'
import { capWaitPiecesOf } from './capWaitPiecesOf'
import { HoldoutCheckRows } from './HoldoutCheckRows'
import { LessonRows } from './LessonRows'
import {
  isPastLearningCap,
  type LessonCardContent,
  lessonCardOf,
  readWordsLabelOf,
} from './lessonCardOf'
import { lessonLinesOf } from './lessonLinesOf'
import { releasedRowOf } from './releasedRowOf'
import { SchoolNextStep } from './SchoolNextStep'
import { ShownLesson } from './ShownLesson'
import { SkillList } from './SkillList'
import { TextRows } from './TextRows'
import type { SchoolLessons } from './useSchoolLessons'

export interface SchoolScreenProps {
  readonly town: LiveTown
  readonly lessons: SchoolLessons
}

function slotStateOf(
  town: LiveTown,
  lessons: SchoolLessons,
  onStopped: () => void,
  copy: PlayerCopy,
): BuildSlotState {
  const { chrome } = copy
  const slot = town.lessonSlot
  if (slot === null) {
    return {
      kind: 'idle',
      title: chrome((catalog) => catalog.schoolSlotTitle()),
      invitation: chrome((catalog) => catalog.schoolSlotIdle()),
    }
  }
  const lines = lessonLinesOf(lessonNameOf(slot.lessonId, town.overview), copy)
  const lesson = { buildingName: lines.title, levelLabel: undefined }
  if (slot.remainingSeconds <= 0) {
    return {
      kind: 'justFinished',
      title: chrome((catalog) => catalog.schoolSlotTitle()),
      message: chrome((catalog) => catalog.schoolSlotDone()),
      ...lesson,
    }
  }
  return {
    kind: 'busy',
    title: chrome((catalog) => catalog.schoolSlotTitle()),
    remainingSeconds: slot.remainingSeconds,
    time: chrome((catalog) => formatFinish(catalog, slot.remainingSeconds, town.at)),
    totalSeconds: slot.totalSeconds,
    finishedLabel: chrome((catalog) => catalog.townWorkReady()),
    cancel: {
      label: chrome((catalog) => catalog.schoolSlotStop()),
      accessibleName: lines.stopOf,
      isWaiting: lessons.isStopping,
      onCancel: () => lessons.stop(slot.lessonId, onStopped),
    },
    refund: chrome((catalog) => catalog.schoolSlotRefund()),
    ...lesson,
  }
}

const learningFullLineOf = (copy: PlayerCopy, count: number, town: LiveTown): Label =>
  chromeWithFiguresOf(copy, (catalog, figure) => {
    const pieces = capWaitPiecesOf(catalog, town)
    const wordCount = figure(String(count))
    return pieces === null
      ? catalog.schoolLearningFull({ count, wordCount })
      : catalog.schoolLearningFullNextWordDue({
          count,
          wordCount,
          timeLeft: joinFinishPieces(pieces.map(figure)),
        })
  })

function LearningLoad({ town }: { readonly town: LiveTown }): ReactElement {
  const copy = usePlayerCopy()
  const { chrome } = copy
  const { learning } = town.overview
  const next = town.overview.lessons.find(
    (lesson) => !lesson.isStudied && town.overview.lessonSlot?.lessonId !== lesson.id,
  )
  return (
    <section className="flex flex-col gap-2 rounded-md border border-line bg-surface-raised p-5">
      <p className="m-0 font-sans text-body text-ink">
        <LabelText
          label={chrome((catalog) =>
            catalog.schoolLearning({ inLearning: learning.inLearning, cap: learning.cap }),
          )}
        />
      </p>
      <Track value={learning.inLearning} total={learning.cap} fillClass="fill-action" />
      {next !== undefined && isPastLearningCap(next, town.overview) && (
        <p className="m-0 font-sans text-caption text-warning-ink">
          <LabelText label={learningFullLineOf(copy, next.words.length, town)} />
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
  const copy = usePlayerCopy()
  const { overview } = town
  const { nextStep } = overview
  if (nextStep.kind !== 'reviews') {
    return null
  }
  const action = reviewsActionOf(copy, nextStep.readFirst)
  const named =
    action.to === '/school/$lessonId'
      ? {
          ...action,
          label: readWordsLabelOf(action.lessonId, shownLessonId, overview, copy),
        }
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

const isAheadOfTheShelf = ({ kind }: NextStep): boolean =>
  kind === 'releasedLesson' || kind === 'holdoutCheck'

const stepReleasedIdOf = (nextStep: NextStep): string | undefined =>
  nextStep.kind === 'releasedLesson' ? nextStep.lessonId : undefined

export function SchoolScreen({ town, lessons }: SchoolScreenProps): ReactElement {
  const { overview } = town
  const copy = usePlayerCopy()
  const { chrome } = copy
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined)
  const blockTitle = useFocusTarget<HTMLHeadingElement>()
  const slotTitle = useFocusTarget<HTMLSpanElement>()
  const focusBlockTitle = blockTitle.focus
  useEffect(() => {
    if (selectedId !== undefined) {
      focusBlockTitle()
    }
  }, [selectedId, focusBlockTitle])
  const cards = overview.lessons.map((lesson) => lessonCardOf(lesson, overview, copy))
  const isStepAhead = selectedId === undefined && isAheadOfTheShelf(overview.nextStep)
  const shown = isStepAhead ? undefined : shownCardOf(cards, selectedId)
  const stepReleasedId = shown === undefined ? stepReleasedIdOf(overview.nextStep) : undefined
  const releasedCards = overview.releasedLessons
    .filter(({ id }) => id !== stepReleasedId)
    .map((lesson) => releasedRowOf(lesson, overview, copy))
  const stopRefused = lessons.stopRefused
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h1 className="m-0 font-sans text-display text-ink">
          <LabelText label={chrome((catalog) => catalog.namesPlacesSchool())} />
        </h1>
        <p className="m-0 font-sans text-caption text-ink-muted tabular-nums">
          <LabelText
            label={chrome((catalog) =>
              catalog.townLevel({ level: overview.buildings.school.level }),
            )}
          />
        </p>
      </header>
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-6">
          {shown === undefined ? (
            <SchoolNextStep town={town} lessons={lessons} />
          ) : (
            <ShownLesson card={shown} town={town} lessons={lessons} titleRef={blockTitle.ref} />
          )}
          <LearningLoad town={town} />
          {shown !== undefined && <ReviewsLink town={town} shownLessonId={shown.lessonId} />}
        </div>
        <div className="flex min-w-0 flex-col gap-6">
          <HoldoutCheckRows checks={overview.dueHoldoutChecks} />
          <LessonRows
            cards={cards.filter(({ lessonId }) => lessonId !== shown?.lessonId)}
            releasedCards={releasedCards}
            town={town}
            lessons={lessons}
            onSelect={setSelectedId}
          />
          <TextRows texts={overview.texts} />
          <BandLines bandLines={overview.bandLines} hasBandStarted={overview.hasBandStarted} />
          <BuildSlot
            state={slotStateOf(town, lessons, slotTitle.focus, copy)}
            titleRef={slotTitle.ref}
          />
          {stopRefused !== undefined && (
            <FormAlert
              message={copy.fixedCopy((catalog) =>
                refusalLineOf(catalog, stopRefused.refusal, stopRefused.error),
              )}
            />
          )}
          <SkillList
            skills={overview.skills}
            title={chrome((catalog) => catalog.schoolSkills())}
            empty={chrome((catalog) => catalog.schoolSkillsNone())}
          />
        </div>
      </div>
    </div>
  )
}
