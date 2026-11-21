import type { ReactElement } from 'react'
import type { PlayerCopy } from '../copy/PlayerCopy'
import { usePlayerCopy } from '../copy/usePlayerCopy'
import { Button } from '../design-system/Button'
import { CountdownLine } from '../design-system/CountdownLine'
import type { Label } from '../design-system/Label'
import { LabelText } from '../design-system/LabelText'
import { LiveRegion } from '../design-system/LiveRegion'
import { spokenLineOf } from '../design-system/spokenLineOf'
import { lessonNameOf } from './lessonNameOf'
import type { LiveTown } from './liveTown'
import { NextStepLink } from './NextStepLink'
import { lessonCountdownOf, reviewsActionOf } from './nextStepCardOf'
import type { LessonFinish } from './useLessonFinish'

const finishLineOf = (copy: PlayerCopy, { overview }: LiveTown, lessonId: string): Label => {
  const name = lessonNameOf(lessonId, overview)
  switch (name.kind) {
    case 'shelved':
      return copy.chrome((catalog) => catalog.shellLessonFinishLine({ number: name.number }))
    case 'released':
      return copy.fixedCopy((catalog) =>
        catalog.shellLessonFinishReleased({ band: name.band, number: name.set }),
      )
    default: {
      const unreachable: never = name
      return unreachable
    }
  }
}

function FinishNotice({
  line,
  readFirst,
  onClose,
}: {
  readonly line: Label
  readonly readFirst: ReadonlyArray<string>
  readonly onClose: () => void
}): ReactElement {
  const copy = usePlayerCopy()
  return (
    <section
      aria-label={spokenLineOf(line)}
      className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-ink bg-surface-sunken px-5 py-3 md:px-8"
    >
      <p className="m-0 font-sans text-label text-ink">
        <LabelText label={line} />
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <NextStepLink action={reviewsActionOf(copy, readFirst)} tone="quiet" />
        <Button type="button" tone="quiet" onClick={onClose}>
          <LabelText label={copy.chrome((catalog) => catalog.shellLessonFinishClose())} />
        </Button>
      </div>
    </section>
  )
}

export interface TownStatusProps {
  readonly town: LiveTown | undefined
  readonly finish: LessonFinish
  readonly onFocusAfterClose: () => void
}

export function TownStatus({ town, finish, onFocusAfterClose }: TownStatusProps): ReactElement {
  const copy = usePlayerCopy()
  const countdown = town === undefined ? undefined : lessonCountdownOf(copy, town)
  const line =
    town === undefined || finish.lessonId === undefined
      ? undefined
      : finishLineOf(copy, town, finish.lessonId)
  const closeNotice = (): void => {
    onFocusAfterClose()
    finish.close()
  }
  return (
    <>
      <LiveRegion line={line === undefined ? '' : spokenLineOf(line)} sequence={finish.sequence} />
      {countdown !== undefined && (
        <div className="bg-surface-sunken px-5 py-1 md:px-8">
          <CountdownLine {...countdown} />
        </div>
      )}
      {line !== undefined && finish.noticeReadFirst !== undefined && (
        <FinishNotice line={line} readFirst={finish.noticeReadFirst} onClose={closeNotice} />
      )}
    </>
  )
}
