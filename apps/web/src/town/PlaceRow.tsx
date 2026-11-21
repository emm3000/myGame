import type { BuildingKind } from '@mygame/contracts'
import type { ReactElement } from 'react'
import { usePlayerCopy } from '../copy/usePlayerCopy'
import { CardAction } from '../design-system/CardAction'
import { CostList } from '../design-system/CostList'
import { LabelText } from '../design-system/LabelText'
import { PlaceArt } from '../design-system/PlaceArt'
import { raisedPlaceArtOf } from '../design-system/placeArtOf'
import type { LiveTown } from './liveTown'
import { placeCardOf } from './placeCardOf'

export interface PlaceRowProps {
  readonly place: BuildingKind
  readonly town: LiveTown
  readonly levelBefore: number
  readonly isWaiting: boolean
  readonly onBuild: () => void
}

export function PlaceRow({
  place,
  town,
  levelBefore,
  isWaiting,
  onBuild,
}: PlaceRowProps): ReactElement {
  const { name, levelLabel, effect, costs, wordsLine, actionLabel, state } = placeCardOf(
    usePlayerCopy(),
    place,
    town,
  )
  return (
    <div className="flex items-start gap-3">
      <PlaceArt
        shapes={raisedPlaceArtOf(place, levelBefore, town.overview.buildings[place].level)}
        sizeClass="size-thumbnail"
      />
      <div className="flex min-w-0 grow flex-col gap-2">
        <div>
          <h4 className="m-0 font-sans text-title text-ink">
            <LabelText label={name} />
          </h4>
          <p className="m-0 font-sans text-caption text-ink-muted tabular-nums">
            <LabelText label={levelLabel} />
          </p>
        </div>
        <p className="m-0 font-sans text-caption text-ink-muted">
          <LabelText label={effect} />
        </p>
        {state.kind !== 'atMaxLevel' && <CostList costs={costs} />}
        {wordsLine !== null && (
          <p className="m-0 font-sans text-caption text-ink-muted">
            <LabelText label={wordsLine} />
          </p>
        )}
        <CardAction
          type="button"
          label={actionLabel}
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
