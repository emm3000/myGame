import type { TownOverview } from '@mygame/contracts'
import type { ReactElement } from 'react'
import { usePlayerCopy } from '../copy/usePlayerCopy'
import { strokeWidths } from '../design/tokens'
import { spokenLineOf } from '../design-system/spokenLineOf'

type RetainedWordsRingProps = NonNullable<TownOverview['learning']['retainedWords']> & {
  readonly countBefore: number
}

const gapBetweenWords = 0.15

export function RetainedWordsRing({
  count,
  total,
  countBefore,
}: RetainedWordsRingProps): ReactElement {
  const label = usePlayerCopy().chrome((catalog) => catalog.shellRetainedWords({ count, total }))
  const isRetainedNow = (position: number): boolean => position >= countBefore && position < count
  const words = Array.from({ length: total }, (_, position) => position)
  return (
    <svg
      role="img"
      aria-label={spokenLineOf(label)}
      lang={label.language}
      viewBox="0 0 32 32"
      fill="none"
      strokeWidth={strokeWidths.ring}
      focusable="false"
      className="size-8 shrink-0 -rotate-90"
    >
      {words.map((position) => (
        <circle
          key={position}
          cx={16}
          cy={16}
          r={14}
          pathLength={total}
          strokeDasharray={`${1 - gapBetweenWords} ${total - 1 + gapBetweenWords}`}
          strokeDashoffset={-position}
          data-registers={isRetainedNow(position) ? 'ring' : undefined}
          className={`${position < count ? 'stroke-ink' : 'stroke-line-strong'} ${isRetainedNow(position) ? 'motion-safe:transition-ring' : ''}`}
        />
      ))}
    </svg>
  )
}
