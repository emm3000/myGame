import type { BuildingKind } from '@mygame/contracts/town'
import type { ReactElement } from 'react'
import { CardAction } from '../design-system/CardAction'
import { CostList } from '../design-system/CostList'
import { formatDuration } from '../design-system/formatDuration'
import { PlaceArt } from '../design-system/PlaceArt'
import { placeArtOf } from '../design-system/placeArtOf'
import type { LiveTown } from './liveTown'
import { placeCardOf } from './placeCardOf'

export interface PlaceRowProps {
  readonly place: BuildingKind
  readonly town: LiveTown
  readonly isWaiting: boolean
  readonly onBuild: () => void
}

export function PlaceRow({ place, town, isWaiting, onBuild }: PlaceRowProps): ReactElement {
  const { name, levelLabel, effect, costs, actionLabel, durationSeconds, state } = placeCardOf(
    place,
    town,
  )
  return (
    <div className="flex items-start gap-3">
      <PlaceArt
        shapes={placeArtOf(place, town.overview.buildings[place].level)}
        sizeClass="size-thumbnail"
      />
      <div className="flex min-w-0 grow flex-col gap-2">
        <div>
          <h4 className="m-0 font-sans text-title text-ink">{name}</h4>
          <p className="m-0 font-sans text-caption text-ink-muted tabular-nums">{levelLabel}</p>
        </div>
        <p className="m-0 font-sans text-caption text-ink-muted">{effect}</p>
        {state.kind !== 'atMaxLevel' && <CostList costs={costs} />}
        <CardAction
          type="button"
          label={`${actionLabel} · ${formatDuration(durationSeconds)}`}
          state={state}
          isWaiting={isWaiting}
          tone="quiet"
          keepsLabelWidth
          onAction={onBuild}
        />
      </div>
    </div>
  )
}
