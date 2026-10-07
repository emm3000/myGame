import type { FiefOverview, ProvinceMap } from '@mygame/contracts'
import { useEffect, useState } from 'react'
import type { ApiClient, ApiRefusal } from '../api/apiClient'
import { copy } from '../copy'
import type { PlotAction } from '../design-system/PlotTile'
import { useLayoutFief } from '../fief/useLayoutFief'
import { useFiefList } from '../shell/useFiefList'
import { partyKinds } from '../units/partyKinds'
import { byUnitKind } from './byUnitKind'
import { cargoOf } from './cargoOf'
import type { MarchEntries, MarchTarget, PlotCamp } from './marchFormOf'
import { marchRefusalLineOf } from './marchRefusalLineOf'
import { unitsAtHomeOf } from './unitsAtHomeOf'
import { useMarch } from './useMarch'

export interface MapMarch {
  readonly overview: FiefOverview | undefined
  readonly fiefRefusal: ApiRefusal | undefined
  readonly target: OpenTarget | undefined
  readonly openKey: string | undefined
  readonly entries: MarchEntries
  readonly name: string
  readonly sentPlot: number | undefined
  readonly panelPlot: number | undefined
  readonly isWaiting: boolean
  readonly refusalLine: string | undefined
  readonly onEntriesChange: (entries: MarchEntries) => void
  readonly onNameChange: (name: string) => void
  readonly onSend: () => void
  readonly plotActionsOf: (map: ProvinceMap, plot: number) => ReadonlyArray<PlotAction>
}

export type PlotOrder =
  | { readonly kind: 'party' }
  | { readonly kind: 'found' }
  | { readonly kind: 'transport'; readonly toFiefId: string }

export interface OpenTarget extends MarchTarget {
  readonly order: PlotOrder
}

type Plot = ProvinceMap['plots'][number]

const firstHours = '1'

const unloadedCargo: MarchEntries['cargo'] = {
  wood: '0',
  stone: '0',
  iron: '0',
  gold: '0',
  food: '0',
}

const firstEntriesOf = (fief: FiefOverview): MarchEntries => {
  const atHome = unitsAtHomeOf(fief)
  const firstSentIndex = Math.max(
    0,
    partyKinds.findIndex((unit) => atHome[unit] > 0),
  )
  return {
    units: byUnitKind((unit) => (partyKinds.indexOf(unit) === firstSentIndex ? '1' : '0')),
    hours: firstHours,
    cargo: unloadedCargo,
  }
}

const unopenedEntries: MarchEntries = {
  units: byUnitKind(() => '0'),
  hours: firstHours,
  cargo: unloadedCargo,
}

const isSameChoice = (
  chosen: OpenTarget | undefined,
  map: ProvinceMap,
  plot: number,
  order: PlotOrder,
): boolean =>
  chosen?.province === map.province && chosen.plot === plot && chosen.order.kind === order.kind

const labelsOf = (order: PlotOrder, plot: number, camp: PlotCamp | null): [string, string] => {
  if (order.kind === 'found') {
    return [copy.founding.found, copy.founding.foundOn(plot)]
  }
  if (order.kind === 'transport') {
    return [copy.transport.send, copy.transport.sendTo(plot)]
  }
  return camp === null
    ? [copy.march.send, copy.march.sendTo(plot)]
    : [copy.march.attack, copy.march.attackTo(plot)]
}

export function useMapMarch(
  apiClient: ApiClient,
  fiefId: string,
  map: ProvinceMap | undefined,
  onFoundingSent: () => void,
  onSent: () => void,
): MapMarch {
  const fief = useLayoutFief()
  const fiefs = useFiefList(apiClient)
  const overview = fief.state.kind === 'live' ? fief.state.fief.overview : undefined
  const [chosen, setChosen] = useState<OpenTarget>()
  const [entries, setEntries] = useState(unopenedEntries)
  const [name, setName] = useState('')
  const [sent, setSent] = useState<{ readonly province: number; readonly plot: number }>()
  const shownProvince = map?.province
  const target = chosen?.province === shownProvince ? chosen : undefined
  const adoptSent = (answered: FiefOverview): void => {
    fief.adopt(answered)
    setChosen(undefined)
    setSent(target === undefined ? undefined : { province: target.province, plot: target.plot })
    onSent()
    if (answered.march?.order === 'found') {
      onFoundingSent()
    }
  }
  const march = useMarch(apiClient, fiefId, adoptSent, overview?.readAt)
  const sentPlot = sent?.province === shownProvince ? sent?.plot : undefined

  useEffect(() => {
    if (shownProvince !== undefined) {
      setChosen((open) => (open?.province === shownProvince ? open : undefined))
      setSent((done) => (done?.province === shownProvince ? done : undefined))
    }
  }, [shownProvince])

  const toggle = (
    map: ProvinceMap,
    plot: number,
    camp: PlotCamp | null,
    order: PlotOrder,
    fiefRead: FiefOverview,
  ): void => {
    setSent(undefined)
    march.dismissRefusal()
    if (isSameChoice(target, map, plot, order)) {
      setChosen(undefined)
      return
    }
    setEntries(firstEntriesOf(fiefRead))
    setName(copy.founding.proposedName(fiefRead.name, map.terrain))
    setChosen({ province: map.province, plot, terrain: map.terrain, camp, order })
  }

  const onSend = (): void => {
    if (target === undefined) {
      return
    }
    const { province, plot, order } = target
    if (order.kind === 'found') {
      march.found({ province, plot, name: name.trim() })
      return
    }
    const units = byUnitKind((unit) => Number(entries.units[unit]))
    if (order.kind === 'transport') {
      const cargo = cargoOf(entries.cargo)
      if (cargo !== undefined) {
        march.transport({ toFiefId: order.toFiefId, units, cargo })
      }
      return
    }
    if (target.camp === null) {
      march.send({ province, plot, units, stayHours: Number(entries.hours) })
      return
    }
    march.attack({ province, plot, units })
  }

  const actionOf = (
    shown: ProvinceMap,
    plot: number,
    camp: PlotCamp | null,
    order: PlotOrder,
    fiefRead: FiefOverview,
  ): PlotAction => {
    const [label, accessibleName] = labelsOf(order, plot, camp)
    return {
      label,
      accessibleName,
      isExpanded: isSameChoice(target, shown, plot, order),
      onToggle: () => toggle(shown, plot, camp, order, fiefRead),
    }
  }

  const otherFiefIdAt = (shown: ProvinceMap, { plot, fief: holder }: Plot): string | undefined =>
    holder?.isOwn === true
      ? fiefs?.find(
          ({ id, coordinates }) =>
            id !== fiefId &&
            coordinates.kingdom === shown.kingdom &&
            coordinates.province === shown.province &&
            coordinates.plot === plot,
        )?.id
      : undefined

  const plotActionsOf = (shown: ProvinceMap, plotNumber: number): ReadonlyArray<PlotAction> => {
    const plot = shown.plots.find((each) => each.plot === plotNumber)
    if (overview === undefined || plot === undefined) {
      return []
    }
    if (plot.fief !== null) {
      const toFiefId = otherFiefIdAt(shown, plot)
      return toFiefId === undefined
        ? []
        : [actionOf(shown, plotNumber, null, { kind: 'transport', toFiefId }, overview)]
    }
    const party = actionOf(shown, plotNumber, plot.camp, { kind: 'party' }, overview)
    return plot.camp === null
      ? [party, actionOf(shown, plotNumber, null, { kind: 'found' }, overview)]
      : [party]
  }

  return {
    overview,
    fiefRefusal: fief.state.kind === 'refused' ? fief.state.refusal : undefined,
    target,
    openKey:
      target === undefined ? undefined : `${target.province}:${target.plot}:${target.order.kind}`,
    entries,
    name,
    sentPlot,
    panelPlot: target?.plot ?? sentPlot,
    isWaiting: march.isWaiting,
    refusalLine:
      march.refused === undefined
        ? undefined
        : marchRefusalLineOf(march.refused.refusal, march.refused.message),
    onEntriesChange: setEntries,
    onNameChange: setName,
    onSend,
    plotActionsOf,
  }
}
