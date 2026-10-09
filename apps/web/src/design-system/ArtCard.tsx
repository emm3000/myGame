import type { ResourceKind } from '@mygame/contracts'
import type { ReactElement } from 'react'
import { CardAction, type CardActionState, cardToneOf } from './CardAction'
import { CardHeader } from './CardHeader'
import { type CardCost, CostList } from './CostList'
import { formatDuration } from './formatDuration'
import { Panel } from './Panel'
import { resourceAccent } from './resourceAccent'

export interface ArtEffect {
  readonly resource: ResourceKind
  readonly text: string
}

export interface LibraryRequirement {
  readonly label: string
  readonly isMet: boolean
}

export interface ArtCardProps {
  readonly name: string
  readonly levelLabel: string
  readonly effect: ArtEffect
  readonly costs: ReadonlyArray<CardCost>
  readonly requirement: LibraryRequirement | undefined
  readonly actionLabel: string
  readonly durationSeconds: number
  readonly state: CardActionState
  readonly titleElement: 'h3' | 'h4'
  readonly artSrc: string
  readonly isWaiting?: boolean
  readonly onStudy?: (() => void) | undefined
}

function Effect({ resource, text }: ArtEffect): ReactElement {
  const { Icon, textClass } = resourceAccent[resource]
  return (
    <p className="m-0 flex items-center gap-1 font-body text-caption text-ink-muted">
      <span className={`flex ${textClass}`}>
        <Icon />
      </span>
      <span>{text}</span>
    </p>
  )
}

export function ArtCard(props: ArtCardProps): ReactElement {
  const isAtMaxLevel = props.state.kind === 'atMaxLevel'
  return (
    <Panel element="article" toneClass={cardToneOf(props.state)} spacingClass="gap-3 p-5">
      <img
        src={props.artSrc}
        alt=""
        width={768}
        height={768}
        loading="lazy"
        decoding="async"
        className="aspect-4/3 w-full rounded-md object-cover"
      />
      <CardHeader
        name={props.name}
        levelLabel={props.levelLabel}
        titleElement={props.titleElement}
        isAtMaxLevel={isAtMaxLevel}
      />
      <Effect {...props.effect} />
      {!isAtMaxLevel && <CostList costs={props.costs} />}
      {props.requirement !== undefined && (
        <p
          className={`m-0 font-body text-caption ${props.requirement.isMet ? 'text-ink-muted' : 'text-rust'}`}
        >
          {props.requirement.label}
        </p>
      )}
      <CardAction
        type="button"
        label={`${props.actionLabel} · ${formatDuration(props.durationSeconds)}`}
        state={props.state}
        isWaiting={props.isWaiting ?? false}
        onAction={props.onStudy}
      />
    </Panel>
  )
}
