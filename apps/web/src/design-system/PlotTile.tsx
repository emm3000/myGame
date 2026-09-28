import type { ReactElement } from 'react'

export type PlotHolder =
  | { readonly kind: 'free'; readonly line: string }
  | { readonly kind: 'held'; readonly name: string }
  | { readonly kind: 'own'; readonly name: string; readonly marker: string }

export interface PlotTileProps {
  readonly plotLabel: string
  readonly terrainLabel: string
  readonly holder: PlotHolder
}

const frameClass: Readonly<Record<PlotHolder['kind'], string>> = {
  free: 'border border-line border-dashed bg-surface',
  held: 'border border-line bg-surface-raised shadow-card',
  own: 'border-2 border-river border-l-4 bg-surface-raised shadow-card',
}

const nameClass = 'font-body text-heading text-ink wrap-anywhere'

function Holder({ holder }: { readonly holder: PlotHolder }): ReactElement {
  switch (holder.kind) {
    case 'free':
      return (
        <span className="font-body text-heading font-normal text-ink-faint">{holder.line}</span>
      )
    case 'held':
      return <span className={nameClass}>{holder.name}</span>
    case 'own':
      return (
        <>
          <span className={nameClass}>{holder.name}</span>
          <span className="self-start rounded-sm bg-umber px-2 font-utility text-label uppercase text-on-umber">
            {holder.marker}
          </span>
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
    <li
      aria-current={holder.kind === 'own' ? 'true' : undefined}
      className={`flex flex-col gap-2 rounded-md p-3 ${frameClass[holder.kind]}`}
    >
      <span className="flex items-baseline justify-between gap-2">
        <span className="font-utility text-label uppercase text-ink-muted tabular-nums">
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
