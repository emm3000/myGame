import type { ReactElement } from 'react'
import { CardAction, type CardActionState, cardToneOf } from './CardAction'
import { CardHeader } from './CardHeader'
import { type CardCost, CostList } from './CostList'
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
    <Panel element="article" toneClass={cardToneOf(props.state)} spacingClass="gap-3 p-4">
      {props.artSrc !== undefined && (
        <img
          src={props.artSrc}
          alt=""
          width={1024}
          height={1024}
          loading="lazy"
          decoding="async"
          className="aspect-4/3 w-full rounded-md object-cover"
        />
      )}
      <CardHeader
        name={props.name}
        levelLabel={props.levelLabel}
        titleElement={props.titleElement}
        isAtMaxLevel={isAtMaxLevel}
      />
      <p className="m-0 font-body text-caption text-ink-muted">{props.effect}</p>
      {!isAtMaxLevel && <CostList costs={props.costs} />}
      <CardAction
        state={props.state}
        actionLabel={props.actionLabel}
        durationSeconds={props.durationSeconds}
        isWaiting={props.isWaiting ?? false}
        onAction={props.onUpgrade}
      />
    </Panel>
  )
}
