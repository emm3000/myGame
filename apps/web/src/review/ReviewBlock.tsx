import { type ReactElement, useId } from 'react'
import { Block } from '../design-system/Block'
import { blockHueOf, hueClassOf } from '../design-system/blockHueOf'
import type { ReviewHandle } from './useReview'

export interface ReviewBlockProps {
  readonly cue: string
  readonly cueLang: 'en' | 'es'
  readonly frame: string
  readonly review: Pick<ReviewHandle, 'walked' | 'dueCount' | 'isDealt'>
}

const deepestStack = 2

const stackedBlockClass = 'absolute inset-0 -z-10 rounded-lg'

const stackTurnClasses: ReadonlyArray<string> = ['-rotate-2', 'rotate-2']

function StackedBlocks({
  walked,
  depth,
}: {
  readonly walked: number
  readonly depth: number
}): ReactElement {
  const depths = Array.from({ length: depth }, (_, index) => depth - index)
  return (
    <>
      {depths.map((place) => {
        const hue = blockHueOf(walked + place)
        return (
          <div
            key={place}
            aria-hidden="true"
            data-stacked-hue={hue}
            className={`${stackedBlockClass} ${stackTurnClasses[place - 1] ?? ''} ${hueClassOf(hue)}`}
          />
        )
      })}
    </>
  )
}

export function ReviewBlock({ cue, cueLang, frame, review }: ReviewBlockProps): ReactElement {
  const cueId = useId()
  const { walked, dueCount, isDealt } = review
  return (
    <div className="relative isolate">
      <StackedBlocks walked={walked} depth={Math.min(deepestStack, dueCount - 1)} />
      <div
        key={walked}
        data-registers={isDealt ? 'deal' : undefined}
        className={
          isDealt ? 'motion-safe:transition-deal motion-safe:starting:-rotate-2' : undefined
        }
      >
        <Block hue={blockHueOf(walked)} labelledBy={cueId}>
          <h2 id={cueId} lang={cueLang} className="m-0 text-word wrap-anywhere">
            {cue}
          </h2>
          <p lang="en" className="m-0 text-reading wrap-anywhere">
            {frame}
          </p>
        </Block>
      </div>
    </div>
  )
}
