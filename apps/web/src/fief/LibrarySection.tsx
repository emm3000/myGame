import {
  fiefFinished,
  lessonTitle,
  namesBusyStudy,
  namesIdleStudy,
  namesLevel,
  namesStudySlot,
  studyCancel,
  studyCancelOf,
  studyCancelRefund,
  studyJustFinished,
  studySeasonMark,
  studySection,
} from '@mygame/catalog'
import { type ArtKind, ArtKindSchema } from '@mygame/contracts'
import { type ReactElement, useId } from 'react'
import { ArtCard } from '../design-system/ArtCard'
import { BuildSlot, type BuildSlotState } from '../design-system/BuildSlot'
import type { CancelAction } from '../design-system/CancelAction'
import { capitalize } from '../design-system/capitalize'
import { FormAlert } from '../design-system/FormAlert'
import { Hint, type HintProps } from '../design-system/Hint'
import { useFocusTarget } from '../focus/useFocusTarget'
import { hintFocusingAfterDismiss } from '../hints/hintFocusingAfterDismiss'
import { refusalLineOf } from '../refusals/refusalLineOf'
import { quantitiesOf } from '../resources/quantitiesOf'
import { quantitiesPhraseOf } from '../resources/quantitiesPhraseOf'
import { capitalizedSeasonWithArticleOf } from '../seasons/capitalizedSeasonWithArticleOf'
import { formatFinish } from '../time/formatFinish'
import { artCardOf } from './artCardOf'
import { artNameOf } from './artNameOf'
import { LessonCard } from './LessonCard'
import type { LiveFief } from './liveFief'
import { SeasonSectionHeading } from './SeasonSectionHeading'
import { seasonSectionMarkOf } from './seasonSectionMarkOf'
import { sectionAnchors } from './sectionAnchors'
import type { Study } from './useStudy'

type StudyWork = Exclude<LiveFief['overview']['study'], { readonly kind: 'idle' }>

function workOf(slot: StudyWork): {
  readonly buildingName: string
  readonly levelLabel: string
} {
  return {
    buildingName: capitalize(artNameOf(slot.art)),
    levelLabel: namesLevel({ level: slot.targetLevel }),
  }
}

function cancelOf(slot: StudyWork, study: Study, onCancelled: () => void): CancelAction {
  return {
    label: studyCancel(),
    accessibleName: studyCancelOf({ art: artNameOf(slot.art), level: slot.targetLevel }),
    isWaiting: study.isWaiting,
    onCancel: () => study.cancel({ art: slot.art, targetLevel: slot.targetLevel }, onCancelled),
  }
}

function refundOf(slot: StudyWork): string {
  return studyCancelRefund({ quantities: quantitiesPhraseOf(quantitiesOf(slot.cost)) })
}

function studySlotStateOf(fief: LiveFief, study: Study, onCancelled: () => void): BuildSlotState {
  const { study: slot } = fief.overview
  if (slot.kind === 'idle') {
    return { kind: 'idle', title: namesStudySlot(), invitation: namesIdleStudy() }
  }
  const work = workOf(slot)
  if (fief.studyRemainingSeconds <= 0) {
    return {
      kind: 'justFinished',
      title: namesStudySlot(),
      message: studyJustFinished(),
      ...work,
    }
  }
  return {
    kind: 'busy',
    title: namesBusyStudy(),
    remainingSeconds: fief.studyRemainingSeconds,
    time: formatFinish(fief.studyRemainingSeconds, fief.at),
    totalSeconds: fief.studyTotalSeconds,
    finishedLabel: fiefFinished(),
    cancel: cancelOf(slot, study, onCancelled),
    refund: refundOf(slot),
    ...work,
  }
}

function ArtItem({
  art,
  fief,
  study,
}: {
  readonly art: ArtKind
  readonly fief: LiveFief
  readonly study: Study
}): ReactElement {
  return (
    <li aria-label={artNameOf(art)} className="flex flex-col">
      <ArtCard
        {...artCardOf(art, fief)}
        titleElement="h4"
        isWaiting={study.isWaiting}
        onStudy={() => study.start(art)}
      />
    </li>
  )
}

export function LibrarySection({
  fief,
  study,
  hint,
}: {
  readonly fief: LiveFief
  readonly study: Study
  readonly hint: HintProps | undefined
}): ReactElement {
  const headingId = useId()
  const heading = useFocusTarget<HTMLHeadingElement>()
  const slotTitle = useFocusTarget<HTMLSpanElement>()
  return (
    <section
      id={sectionAnchors.library}
      aria-labelledby={headingId}
      className="flex flex-col gap-3 md:scroll-mt-status"
    >
      <SeasonSectionHeading
        id={headingId}
        headingRef={heading.ref}
        title={studySection()}
        mark={seasonSectionMarkOf(fief.overview.season, 'study', (season) =>
          studySeasonMark({ season: capitalizedSeasonWithArticleOf(season) }),
        )}
      />
      {hint !== undefined && <Hint {...hintFocusingAfterDismiss(hint, heading.focus)} />}
      <div className="grid items-start gap-6 lg:grid-cols-3">
        <BuildSlot
          state={studySlotStateOf(fief, study, slotTitle.focus)}
          titleRef={slotTitle.ref}
        />
        <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2 lg:col-span-2">
          {ArtKindSchema.options.map((art) => (
            <ArtItem key={art} art={art} fief={fief} study={study} />
          ))}
          <li aria-label={lessonTitle()} className="flex flex-col">
            <LessonCard fiefId={fief.overview.id} />
          </li>
        </ul>
      </div>
      {study.refusal !== undefined && <FormAlert message={refusalLineOf(study.refusal)} />}
    </section>
  )
}
