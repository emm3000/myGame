import type { ReactElement } from 'react'
import { formatDuration } from './formatDuration'
import { formatQuantity } from './formatQuantity'
import { Panel } from './Panel'
import { type Accent, resourceAccent } from './resourceAccent'

export interface BuildingCost {
  readonly kind: Accent
  readonly amount: number
  readonly isShort: boolean
}

export type BuildingCardState =
  | { readonly kind: 'affordable' }
  | { readonly kind: 'tooExpensive'; readonly reason: string }
  | { readonly kind: 'notEnoughPeasants'; readonly reason: string }
  | { readonly kind: 'atMaxLevel'; readonly label: string }

export interface BuildingCardProps {
  readonly name: string
  readonly levelLabel: string
  readonly effect: string
  readonly costs: ReadonlyArray<BuildingCost>
  readonly actionLabel: string
  readonly durationSeconds: number
  readonly state: BuildingCardState
  readonly isWaiting?: boolean
  readonly onUpgrade?: (() => void) | undefined
}

const cardTone: Readonly<Record<BuildingCardState['kind'], string>> = {
  affordable: 'border-moss bg-surface-raised',
  tooExpensive: 'border-line bg-surface-raised',
  notEnoughPeasants: 'border-line bg-surface-raised',
  atMaxLevel: 'border-line bg-surface-sunken',
}

function CostList({ costs }: { readonly costs: ReadonlyArray<BuildingCost> }): ReactElement {
  return (
    <ul className="m-0 flex list-none flex-wrap gap-x-3 gap-y-2 p-0 font-utility text-numeral tabular-nums">
      {costs.map((cost) => {
        const { Icon, textClass } = resourceAccent[cost.kind]
        return (
          <li
            key={cost.kind}
            className={`flex items-center gap-1 ${cost.isShort ? 'text-rust' : 'text-ink'}`}
          >
            <span className={`flex ${textClass}`}>
              <Icon />
            </span>
            {formatQuantity(cost.amount)}
          </li>
        )
      })}
    </ul>
  )
}

function Action({
  label,
  accessibleName,
  isEnabled,
  onUpgrade,
}: {
  readonly label: string
  readonly accessibleName?: string
  readonly isEnabled: boolean
  readonly onUpgrade?: (() => void) | undefined
}): ReactElement {
  return (
    <button
      type="button"
      aria-label={accessibleName}
      disabled={!isEnabled}
      onClick={onUpgrade}
      className="cursor-pointer rounded-md border border-umber bg-umber px-3 py-2 font-utility text-button text-on-umber focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-line-strong disabled:cursor-not-allowed disabled:border-line disabled:bg-surface-sunken disabled:text-ink-faint"
    >
      {label}
    </button>
  )
}

interface FooterProps {
  readonly state: BuildingCardState
  readonly actionLabel: string
  readonly durationSeconds: number
  readonly isWaiting: boolean
  readonly onUpgrade: (() => void) | undefined
}

function Footer({
  state,
  actionLabel,
  durationSeconds,
  isWaiting,
  onUpgrade,
}: FooterProps): ReactElement {
  if (state.kind === 'atMaxLevel') {
    return <Action label={state.label} isEnabled={false} />
  }
  const label = `${actionLabel} · ${formatDuration(durationSeconds)}`
  if (state.kind === 'affordable') {
    return <Action label={label} isEnabled={!isWaiting} onUpgrade={onUpgrade} />
  }
  return (
    <div className="flex flex-col gap-2">
      <Action label={label} accessibleName={`${label}. ${state.reason}`} isEnabled={false} />
      <span className="font-body text-caption text-rust">{state.reason}</span>
    </div>
  )
}

export function BuildingCard(props: BuildingCardProps): ReactElement {
  const isAtMaxLevel = props.state.kind === 'atMaxLevel'
  return (
    <Panel element="article" toneClass={cardTone[props.state.kind]} spacingClass="gap-3 p-4">
      <header className="flex items-baseline justify-between gap-2">
        <h3
          className={`m-0 font-display text-title ${isAtMaxLevel ? 'text-ink-muted' : 'text-ink'}`}
        >
          {props.name}
        </h3>
        <span
          className={`rounded-pill px-2 font-utility text-label tabular-nums ${isAtMaxLevel ? 'bg-moss text-on-moss' : 'bg-umber text-on-umber'}`}
        >
          {props.levelLabel}
        </span>
      </header>
      <p className="m-0 font-body text-caption text-ink-muted">{props.effect}</p>
      {!isAtMaxLevel && <CostList costs={props.costs} />}
      <Footer
        state={props.state}
        actionLabel={props.actionLabel}
        durationSeconds={props.durationSeconds}
        isWaiting={props.isWaiting ?? false}
        onUpgrade={props.onUpgrade}
      />
    </Panel>
  )
}
