import {
  mapBackToOwnProvince,
  mapCamp,
  mapCampStrength,
  mapFree,
  mapHeading,
  mapJump,
  mapLoading,
  mapNext,
  mapOwnFief,
  mapOwnFounding,
  mapPlot,
  mapPrevious,
  mapReserved,
  mapTerrain,
  mapTitle,
  refusalProvinceNotFound,
} from '@mygame/catalog'
import type { ProvinceMap } from '@mygame/contracts'
import { type FormEvent, type ReactElement, type ReactNode, type Ref, useId, useState } from 'react'
import { Button } from '../design-system/Button'
import { campThumbnailOf } from '../design-system/campThumbnailOf'
import { FormAlert } from '../design-system/FormAlert'
import { focusTargetClass } from '../design-system/focusTargetClass'
import { Hint, type HintProps } from '../design-system/Hint'
import { NumberField } from '../design-system/NumberField'
import { type PlotAction, type PlotHolder, PlotTile } from '../design-system/PlotTile'
import { TextLink } from '../design-system/TextLink'
import { refusalLineOf } from '../refusals/refusalLineOf'
import { kingdomNameOf } from './kingdomNameOf'
import { panelPlaceOf } from './panelPlaceOf'
import { terrainNameOf } from './terrainNameOf'
import type { ProvinceMapState } from './useProvinceMap'

export interface MarchPanelSlot {
  readonly plot: number
  readonly content: ReactNode
}

export interface MapScreenProps {
  readonly fiefId: string
  readonly state: ProvinceMapState
  readonly onBrowse: (province: number) => void
  readonly plotActionsOf: (map: ProvinceMap, plot: number) => ReadonlyArray<PlotAction>
  readonly columns: number
  readonly marchPanel: MarchPanelSlot | undefined
  readonly fiefRefusalLine: string | undefined
  readonly hint: HintProps | undefined
  readonly provinceHeadingRef?: Ref<HTMLHeadingElement> | undefined
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
      line: mapReserved(),
      marker: reservation.isOwn ? mapOwnFounding() : undefined,
    }
  }
  if (fief === null && camp !== null) {
    return {
      kind: 'camp',
      artSrc: campThumbnailOf(camp.tier),
      line: mapCamp(),
      strength: mapCampStrength({ tier: camp.tier, strength: camp.strength }),
      actions,
    }
  }
  if (fief === null) {
    return { kind: 'free', line: mapFree(), actions }
  }
  return fief.isOwn
    ? { kind: 'own', line: mapOwnFief({ name: fief.name }), actions }
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
        accessibleName={mapJump()}
        min={1}
        max={map.lastProvince}
        value={value}
        onChange={setValue}
      />
      <Button type="submit" tone="primary">
        {mapJump()}
      </Button>
    </form>
  )
}

function Province({
  map,
  onBrowse,
  plotActionsOf,
  columns,
  marchPanel,
  fiefRefusalLine,
  hint,
  provinceHeadingRef,
}: ProvinceProps): ReactElement {
  const panelId = useId()
  const heading = mapHeading({ kingdom: kingdomNameOf(map.kingdom), province: map.province })
  const terrainLabel = terrainNameOf(map.terrain)
  const panelPosition = map.plots.findIndex(({ plot }) => plot === marchPanel?.plot)
  const panelPlace =
    panelPosition < 0 ? undefined : panelPlaceOf(panelPosition, columns, map.plots.length)
  const actionsOf = (plot: number): ReadonlyArray<PlotAction> =>
    plotActionsOf(map, plot).map((action) =>
      action.isExpanded ? { ...action, controls: panelId } : action,
    )
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          tone="quiet"
          availability={map.province <= 1 ? 'blocked' : 'available'}
          onClick={() => onBrowse(map.province - 1)}
        >
          {mapPrevious()}
        </Button>
        <Button
          type="button"
          tone="quiet"
          availability={map.province >= map.lastProvince ? 'blocked' : 'available'}
          onClick={() => onBrowse(map.province + 1)}
        >
          {mapNext()}
        </Button>
        <JumpControl key={map.province} map={map} onBrowse={onBrowse} />
      </div>
      <div className="flex flex-col gap-1">
        <h3
          ref={provinceHeadingRef}
          tabIndex={-1}
          className={`m-0 self-start rounded-sm font-sans text-title text-ink ${focusTargetClass}`}
        >
          {heading}
        </h3>
        <p className="m-0 font-sans text-caption text-ink-muted">
          {mapTerrain({ terrain: terrainNameOf(map.terrain) })}
        </p>
      </div>
      {hint !== undefined && <Hint {...hint} />}
      <div className="overflow-hidden rounded-md bg-surface-sunken pb-3">
        <ul
          aria-label={heading}
          className="mx-3 mt-3 mb-0 grid list-none grid-cols-2 gap-3 p-0 lg:grid-cols-5"
        >
          {map.plots.flatMap((plot, position) => {
            const tile = (
              <PlotTile
                key={plot.plot}
                plotLabel={mapPlot({ plot: plot.plot })}
                terrainLabel={terrainLabel}
                holder={holderOf(plot, actionsOf(plot.plot))}
              />
            )
            return position === panelPlace
              ? [
                  tile,
                  <li key={panelId} id={panelId} className="col-span-full">
                    {marchPanel?.content}
                  </li>,
                ]
              : [tile]
          })}
        </ul>
      </div>
      {fiefRefusalLine !== undefined && <FormAlert message={fiefRefusalLine} />}
    </div>
  )
}

function MapBody({ state, ...province }: MapScreenProps): ReactElement {
  switch (state.kind) {
    case 'loading':
      return <p className="m-0">{mapLoading()}</p>
    case 'refused':
      return state.refusal === 'ProvinceNotFound' ? (
        <div className="flex flex-col items-start gap-3">
          <FormAlert message={refusalProvinceNotFound()} />
          <TextLink to="/feudo/$fiefId/mapa" params={{ fiefId: province.fiefId }}>
            {mapBackToOwnProvince()}
          </TextLink>
        </div>
      ) : (
        <FormAlert message={refusalLineOf(state.refusal)} />
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
      <h2 className="m-0 font-sans text-title text-ink">{mapTitle()}</h2>
      <MapBody {...props} />
    </section>
  )
}
