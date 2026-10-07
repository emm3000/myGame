import type { ProvinceMap } from '@mygame/contracts'
import { type FormEvent, type ReactElement, type ReactNode, useState } from 'react'
import { copy } from '../copy'
import { Button } from '../design-system/Button'
import { FormAlert } from '../design-system/FormAlert'
import { Hint, type HintProps } from '../design-system/Hint'
import { NumberField } from '../design-system/NumberField'
import { type PlotAction, type PlotHolder, PlotTile } from '../design-system/PlotTile'
import { TextLink } from '../design-system/TextLink'
import type { ProvinceMapState } from './useProvinceMap'

export interface MapScreenProps {
  readonly fiefId: string
  readonly state: ProvinceMapState
  readonly onBrowse: (province: number) => void
  readonly plotActionsOf: (map: ProvinceMap, plot: number) => ReadonlyArray<PlotAction>
  readonly marchPanel: ReactNode
  readonly hint: HintProps | undefined
}

type ProvinceProps = { readonly map: ProvinceMap } & Omit<MapScreenProps, 'state'>

type Plot = ProvinceMap['plots'][number]

function holderOf(
  { fief, camp, reservation }: Plot,
  actions: ReadonlyArray<PlotAction>,
): PlotHolder {
  if (fief === null && reservation !== null) {
    return {
      kind: 'reserved',
      line: copy.map.reserved,
      marker: reservation.isOwn ? copy.map.ownFounding : undefined,
    }
  }
  if (fief === null && camp !== null) {
    return {
      kind: 'camp',
      line: copy.map.camp,
      strength: copy.map.campStrength(camp.tier, camp.strength),
      actions,
    }
  }
  if (fief === null) {
    return { kind: 'free', line: copy.map.free, actions }
  }
  return fief.isOwn
    ? { kind: 'own', name: fief.name, marker: copy.map.ownFief, actions }
    : { kind: 'held', name: fief.name }
}

function JumpControl({
  map,
  onBrowse,
}: { readonly map: ProvinceMap } & Pick<MapScreenProps, 'onBrowse'>): ReactElement {
  const [value, setValue] = useState(String(map.province))

  const jump = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault()
    const province = Number(value)
    if (Number.isInteger(province) && province >= 1 && province <= map.lastProvince) {
      onBrowse(province)
    }
  }

  return (
    <form onSubmit={jump} className="m-0 flex items-center gap-2 md:ml-auto">
      <NumberField
        accessibleName={copy.map.jump}
        min={1}
        max={map.lastProvince}
        value={value}
        onChange={setValue}
      />
      <Button type="submit" tone="primary">
        {copy.map.jump}
      </Button>
    </form>
  )
}

function Province({ map, onBrowse, plotActionsOf, marchPanel, hint }: ProvinceProps): ReactElement {
  const heading = copy.map.heading(map.kingdom, map.province)
  const terrainLabel = copy.names.terrains[map.terrain]
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          tone="quiet"
          disabled={map.province <= 1}
          onClick={() => onBrowse(map.province - 1)}
        >
          {copy.map.previous}
        </Button>
        <Button
          type="button"
          tone="quiet"
          disabled={map.province >= map.lastProvince}
          onClick={() => onBrowse(map.province + 1)}
        >
          {copy.map.next}
        </Button>
        <JumpControl key={map.province} map={map} onBrowse={onBrowse} />
      </div>
      <div className="flex flex-col gap-1">
        <h3 className="m-0 font-display text-title text-ink">{heading}</h3>
        <p className="m-0 font-body text-caption text-ink-muted">{copy.map.terrain(map.terrain)}</p>
      </div>
      {hint !== undefined && <Hint {...hint} placement="standalone" />}
      <ul aria-label={heading} className="m-0 grid list-none grid-cols-2 gap-3 p-0 lg:grid-cols-5">
        {map.plots.map((plot) => (
          <PlotTile
            key={plot.plot}
            plotLabel={copy.map.plot(plot.plot)}
            terrainLabel={terrainLabel}
            holder={holderOf(plot, plotActionsOf(map, plot.plot))}
          />
        ))}
      </ul>
      {marchPanel}
    </div>
  )
}

function MapBody({ state, ...province }: MapScreenProps): ReactElement {
  switch (state.kind) {
    case 'loading':
      return <p className="m-0">{copy.map.loading}</p>
    case 'refused':
      return state.refusal === 'ProvinceNotFound' ? (
        <div className="flex flex-col items-start gap-3">
          <FormAlert message={copy.refusals.ProvinceNotFound} />
          <TextLink to="/feudo/$fiefId/mapa" params={{ fiefId: province.fiefId }}>
            {copy.map.backToOwnProvince}
          </TextLink>
        </div>
      ) : (
        <FormAlert message={copy.refusals[state.refusal]} />
      )
    case 'read':
      return <Province map={state.map} {...province} />
    default: {
      const unreachable: never = state
      return unreachable
    }
  }
}

export function MapScreen(props: MapScreenProps): ReactElement {
  return (
    <section className="flex flex-col gap-6">
      <h2 className="m-0 font-display text-title text-ink">{copy.map.title}</h2>
      <MapBody {...props} />
    </section>
  )
}
