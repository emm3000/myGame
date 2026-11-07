import { shellRetainedWords } from '@mygame/catalog'
import type { TownOverview } from '@mygame/contracts/town'
import type { ReactElement } from 'react'
import { strokeWidths } from '../design/tokens'

type RetainedWordsRingProps = NonNullable<TownOverview['learning']['retainedWords']>

const gapBetweenWords = 0.15

export function RetainedWordsRing({ count, total }: RetainedWordsRingProps): ReactElement {
  const words = Array.from({ length: total }, (_, position) => position)
  return (
    <svg
      role="img"
      aria-label={shellRetainedWords({ count, total })}
      viewBox="0 0 16 16"
      fill="none"
      strokeWidth={strokeWidths.mark}
      focusable="false"
      className="size-8 shrink-0 -rotate-90"
    >
      {words.map((position) => (
        <circle
          key={position}
          cx={8}
          cy={8}
          r={7}
          pathLength={total}
          strokeDasharray={`${1 - gapBetweenWords} ${total - 1 + gapBetweenWords}`}
          strokeDashoffset={-position}
          className={position < count ? 'stroke-ink' : 'stroke-surface-sunken'}
        />
      ))}
    </svg>
  )
}
