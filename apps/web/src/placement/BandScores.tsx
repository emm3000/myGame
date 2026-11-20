import { placementNotPlacedOut, placementPlacedOut, placementResultBand } from '@mygame/catalog'
import type { ReactElement } from 'react'
import type { AskingPlacement } from './useBandWalk'

type PlacementScore = AskingPlacement['scores'][number]

export function BandScores({
  scores,
}: {
  readonly scores: ReadonlyArray<PlacementScore>
}): ReactElement | null {
  if (scores.length === 0) {
    return null
  }
  return (
    <ul className="m-0 flex list-none flex-col gap-2 p-0">
      {scores.map((score) => (
        <li key={score.band} className="flex flex-col border-line border-t pt-2 font-sans">
          <span className="text-body text-ink">
            {placementResultBand({ band: score.band, score: score.score })}
          </span>
          <span className="text-caption text-ink-muted">
            {score.isPlacedOut ? placementPlacedOut() : placementNotPlacedOut()}
          </span>
        </li>
      ))}
    </ul>
  )
}
