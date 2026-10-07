import { type ArtKind, ArtKindSchema } from '@mygame/contracts'
import { type ReactElement, useId } from 'react'
import { copy } from '../copy'
import { ArtCard } from '../design-system/ArtCard'
import { BuildSlot, type BuildSlotState } from '../design-system/BuildSlot'
import { capitalize } from '../design-system/capitalize'
import { FormAlert } from '../design-system/FormAlert'
import { Hint, type HintProps } from '../design-system/Hint'
import { useFocusTarget } from '../focus/useFocusTarget'
import { hintFocusingAfterDismiss } from '../hints/hintFocusingAfterDismiss'
import { formatFinish } from '../time/formatFinish'
import { artCardOf } from './artCardOf'
import type { LiveFief } from './liveFief'
import { SeasonSectionHeading } from './SeasonSectionHeading'
import { seasonSectionMarkOf } from './seasonSectionMarkOf'
import { sectionAnchors } from './sectionAnchors'
import type { Study } from './useStudy'

const { names } = copy

function studySlotStateOf(fief: LiveFief, study: Study, onCancelled: () => void): BuildSlotState {
  const { study: slot } = fief.overview
  if (slot.kind === 'idle') {
    return { kind: 'idle', title: names.studySlot, invitation: names.idleStudy }
  }
  const art = {
    buildingName: capitalize(names.arts[slot.art]),
    levelLabel: names.level(slot.targetLevel),
  }
  if (fief.studyRemainingSeconds <= 0) {
    return {
      kind: 'justFinished',
      title: names.studySlot,
      message: copy.study.justFinished,
      ...art,
    }
  }
  return {
    kind: 'busy',
    title: names.busyStudy,
    remainingSeconds: fief.studyRemainingSeconds,
    time: formatFinish(fief.studyRemainingSeconds, fief.at),
    totalSeconds: fief.studyTotalSeconds,
    finishedLabel: copy.fief.finished,
    cancel: {
      label: copy.study.cancel,
      accessibleName: copy.study.cancelOf(slot.art, slot.targetLevel),
      isWaiting: study.isWaiting,
      onCancel: () => study.cancel({ art: slot.art, targetLevel: slot.targetLevel }, onCancelled),
    },
    ...art,
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
    <li aria-label={names.arts[art]} className="flex flex-col">
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
        title={copy.study.section}
        mark={seasonSectionMarkOf(fief.overview.season, 'study', copy.study.seasonMark)}
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
        </ul>
      </div>
      {study.refusal !== undefined && <FormAlert message={copy.refusals[study.refusal]} />}
    </section>
  )
}
