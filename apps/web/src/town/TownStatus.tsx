import { shellLessonFinishClose, shellLessonFinishLine } from '@mygame/catalog'
import type { ReactElement } from 'react'
import { Button } from '../design-system/Button'
import { CountdownLine } from '../design-system/CountdownLine'
import { LiveRegion } from '../design-system/LiveRegion'
import { lessonNumberOf } from '../school/lessonCardOf'
import type { LiveTown } from './liveTown'
import { NextStepLink } from './NextStepLink'
import { lessonCountdownOf, reviewsActionOf } from './nextStepCardOf'
import type { LessonFinish } from './useLessonFinish'

const finishLineOf = ({ overview }: LiveTown, lessonId: string): string =>
  shellLessonFinishLine({ number: lessonNumberOf(lessonId, overview) })

function FinishNotice({
  town,
  line,
  onClose,
}: {
  readonly town: LiveTown
  readonly line: string
  readonly onClose: () => void
}): ReactElement {
  const { nextStep } = town.overview
  const readFirst = nextStep.kind === 'reviews' ? nextStep.readFirst : []
  return (
    <section
      aria-label={line}
      className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-right bg-right-soft px-4 py-3 md:px-8"
    >
      <p className="m-0 font-sans text-label text-ink">{line}</p>
      <div className="flex flex-wrap items-center gap-2">
        <NextStepLink action={reviewsActionOf(readFirst)} tone="primary" onFollow={onClose} />
        <Button type="button" tone="quiet" onClick={onClose}>
          {shellLessonFinishClose()}
        </Button>
      </div>
    </section>
  )
}

export interface TownStatusProps {
  readonly town: LiveTown | undefined
  readonly finish: LessonFinish
}

export function TownStatus({ town, finish }: TownStatusProps): ReactElement {
  const countdown = town === undefined ? undefined : lessonCountdownOf(town)
  const line =
    town === undefined || finish.lessonId === undefined
      ? undefined
      : finishLineOf(town, finish.lessonId)
  return (
    <>
      <LiveRegion line={line ?? ''} sequence={finish.sequence} />
      {countdown !== undefined && (
        <div className="bg-surface-sunken px-4 py-1 md:px-8">
          <CountdownLine {...countdown} />
        </div>
      )}
      {town !== undefined && line !== undefined && (
        <FinishNotice town={town} line={line} onClose={finish.close} />
      )}
    </>
  )
}
