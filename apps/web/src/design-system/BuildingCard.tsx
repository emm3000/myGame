import type { ReactElement } from 'react'
import { CardAction, type CardActionState, cardToneOf } from './CardAction'
import { CardArt } from './CardArt'
import { CardHeader } from './CardHeader'
import { type CardCost, CostList } from './CostList'
import { formatDuration } from './formatDuration'
import { Panel } from './Panel'

export interface BuildingCardProps {
  readonly name: string
  readonly levelLabel: string
  readonly effect: string
  readonly costs: ReadonlyArray<CardCost>
  readonly actionLabel: string
  readonly durationSeconds: number
  readonly state: CardActionState
  readonly titleElement: 'h3' | 'h4'
  readonly artSrc: string | undefined
  readonly isWaiting?: boolean
  readonly onUpgrade?: (() => void) | undefined
}

export function BuildingCard(props: BuildingCardProps): ReactElement {
  const isAtMaxLevel = props.state.kind === 'atMaxLevel'
  return (
    <Panel element="article" toneClass={cardToneOf(props.state)} spacingClass="gap-3 p-5">
      {props.artSrc !== undefined && <CardArt src={props.artSrc} />}
      <CardHeader
        name={props.name}
        levelLabel={props.levelLabel}
        titleElement={props.titleElement}
        isAtMaxLevel={isAtMaxLevel}
      />
      <p className="m-0 font-body text-caption text-ink-muted">{props.effect}</p>
      {!isAtMaxLevel && <CostList costs={props.costs} />}
      <CardAction
        type="button"
        label={`${props.actionLabel} · ${formatDuration(props.durationSeconds)}`}
        state={props.state}
        isWaiting={props.isWaiting ?? false}
        onAction={props.onUpgrade}
      />
    </Panel>
  )
}
