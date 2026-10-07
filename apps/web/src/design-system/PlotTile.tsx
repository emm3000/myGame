import type { ReactElement } from 'react'
import { Button } from './Button'
import { CampIcon } from './icons/CampIcon'
import { SettlerIcon } from './icons/SettlerIcon'

export interface PlotAction {
  readonly label: string
  readonly accessibleName: string
  readonly isExpanded: boolean
  readonly controls?: string | undefined
  readonly onToggle: () => void
}

export type PlotHolder =
  | { readonly kind: 'free'; readonly line: string; readonly actions: ReadonlyArray<PlotAction> }
  | {
      readonly kind: 'camp'
      readonly line: string
      readonly strength: string
      readonly actions: ReadonlyArray<PlotAction>
    }
  | { readonly kind: 'reserved'; readonly line: string; readonly marker?: string | undefined }
  | { readonly kind: 'held'; readonly name: string }
  | {
      readonly kind: 'own'
      readonly name: string
      readonly marker: string
      readonly actions: ReadonlyArray<PlotAction>
    }

export interface PlotTileProps {
  readonly plotLabel: string
  readonly terrainLabel: string
  readonly holder: PlotHolder
}

const frameClass: Readonly<Record<PlotHolder['kind'], string>> = {
  free: 'border border-line border-dashed bg-surface',
  camp: 'border border-line border-dashed bg-surface',
  reserved: 'border border-line-strong border-dashed bg-surface-sunken',
  held: 'border border-line bg-surface-raised shadow-card',
  own: 'border-2 border-river border-l-4 bg-surface-raised shadow-card',
}

const expandedFrameClass = 'border border-line-strong bg-surface-raised'

const frameClassOf = (holder: PlotHolder): string =>
  (holder.kind === 'free' || holder.kind === 'camp') &&
  holder.actions.some((action) => action.isExpanded)
    ? expandedFrameClass
    : frameClass[holder.kind]

const nameClass = 'font-body text-heading text-ink wrap-anywhere'

const markerClass =
  'self-start rounded-sm bg-umber px-2 font-utility text-label uppercase text-on-umber'

function PlotActionButtons({
  actions,
}: {
  readonly actions: ReadonlyArray<PlotAction>
}): ReactElement | null {
  if (actions.length === 0) {
    return null
  }
  return (
    <span className="mt-auto flex flex-col gap-2">
      {actions.map((action) => (
        <Button
          key={action.accessibleName}
          type="button"
          tone="quiet"
          accessibleName={action.accessibleName}
          isExpanded={action.isExpanded}
          controls={action.controls}
          onClick={action.onToggle}
        >
          {action.label}
        </Button>
      ))}
    </span>
  )
}

function Holder({ holder }: { readonly holder: PlotHolder }): ReactElement {
  switch (holder.kind) {
    case 'free':
      return (
        <>
          <span className="font-body text-heading font-normal text-ink-faint">{holder.line}</span>
          <PlotActionButtons actions={holder.actions} />
        </>
      )
    case 'camp':
      return (
        <>
          <span className="flex flex-col gap-1">
            <span className="flex items-start gap-2">
              <span className="mt-0.5 flex text-ochre">
                <CampIcon sizeClass="size-icon" />
              </span>
              <span className="font-body text-heading font-bold text-ink wrap-anywhere hyphens-auto">
                {holder.line}
              </span>
            </span>
            <span className="font-body text-caption text-ink-muted tabular-nums">
              {holder.strength}
            </span>
          </span>
          <PlotActionButtons actions={holder.actions} />
        </>
      )
    case 'reserved':
      return (
        <>
          <span className="flex items-start gap-2 text-ink-muted">
            <span className="mt-0.5 flex">
              <SettlerIcon />
            </span>
            <span className="font-body text-heading font-normal">{holder.line}</span>
          </span>
          {holder.marker !== undefined && <span className={markerClass}>{holder.marker}</span>}
        </>
      )
    case 'held':
      return <span className={nameClass}>{holder.name}</span>
    case 'own':
      return (
        <>
          <span className={nameClass}>{holder.name}</span>
          <span className={markerClass}>{holder.marker}</span>
          <PlotActionButtons actions={holder.actions} />
        </>
      )
    default: {
      const unreachable: never = holder
      return unreachable
    }
  }
}

export function PlotTile({ plotLabel, terrainLabel, holder }: PlotTileProps): ReactElement {
  return (
    <li className={`flex min-h-plot flex-col gap-2 rounded-md p-3 ${frameClassOf(holder)}`}>
      <span className="flex flex-wrap items-baseline justify-between gap-x-2">
        <span className="whitespace-nowrap font-utility text-label uppercase text-ink-muted tabular-nums">
          {plotLabel}
        </span>
        <span className="font-utility font-semibold text-caption text-ink-muted">
          {terrainLabel}
        </span>
      </span>
      <Holder holder={holder} />
    </li>
  )
}
