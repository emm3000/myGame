import { type ReactElement, useId } from 'react'
import { CardArt } from './CardArt'
import { CountdownLine, type SlotCountdown } from './CountdownLine'
import { MarchIcon } from './icons/MarchIcon'
import { Panel } from './Panel'
import { Track } from './Track'

export interface CargoCardProps {
  readonly title: string
  readonly artSrc: string
  readonly origin: string
  readonly amounts: string
  readonly countdown: SlotCountdown
  readonly elapsedSeconds: number
  readonly totalSeconds: number
}

export function CargoCard({
  title,
  artSrc,
  origin,
  amounts,
  countdown,
  elapsedSeconds,
  totalSeconds,
}: CargoCardProps): ReactElement {
  const titleId = useId()
  return (
    <Panel
      element="article"
      labelledBy={titleId}
      toneClass="bg-surface-raised"
      spacingClass="gap-3 p-5"
    >
      <CardArt src={artSrc} />
      <div className="flex items-center gap-2 text-ink-muted">
        <MarchIcon sizeClass="size-icon" />
        <h3 id={titleId} className="m-0 font-display text-title text-ink">
          {title}
        </h3>
      </div>
      <p className="m-0 font-body text-body text-ink">{origin}</p>
      <p className="m-0 font-body text-body text-ink">{amounts}</p>
      <CountdownLine {...countdown} />
      <Track value={elapsedSeconds} total={totalSeconds} fillClass="fill-slate" />
    </Panel>
  )
}
