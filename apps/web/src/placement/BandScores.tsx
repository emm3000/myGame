import type { Placement } from '@mygame/contracts'
import type { ReactElement } from 'react'
import { usePlayerCopy } from '../copy/usePlayerCopy'
import { LabelText } from '../design-system/LabelText'

type PlacementScore = Extract<Placement, { readonly kind: 'closed' }>['scores'][number]

export function BandScores({
  scores,
}: {
  readonly scores: ReadonlyArray<PlacementScore>
}): ReactElement | null {
  const { fixedCopy } = usePlayerCopy()
  if (scores.length === 0) {
    return null
  }
  return (
    <ul className="m-0 flex list-none flex-col gap-2 p-0">
      {scores.map((score) => (
        <li key={score.band} className="flex flex-col border-line border-t pt-2 font-sans">
          <span className="text-body text-ink">
            <LabelText
              label={fixedCopy((catalog) =>
                catalog.placementResultBand({ band: score.band, score: score.score }),
              )}
            />
          </span>
          <span className="text-caption text-ink-muted">
            <LabelText
              label={fixedCopy((catalog) =>
                score.isPlacedOut ? catalog.placementPlacedOut() : catalog.placementNotPlacedOut(),
              )}
            />
          </span>
        </li>
      ))}
    </ul>
  )
}
