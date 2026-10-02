import type { FiefOverview, ProvinceMap } from '@mygame/contracts'
import { useEffect, useState } from 'react'
import type { ApiClient, ApiRefusal } from '../api/apiClient'
import { copy } from '../copy'
import type { PlotAction } from '../design-system/PlotTile'
import { partyKinds } from '../units/partyKinds'
import { byUnitKind } from './byUnitKind'
import type { MarchEntries, MarchTarget, PlotCamp } from './marchFormOf'
import { marchRefusalLineOf } from './marchRefusalLineOf'
import { unitsAtHomeOf } from './unitsAtHomeOf'
import { useMapFief } from './useMapFief'
import { useMarch } from './useMarch'

export interface MapMarch {
  readonly overview: FiefOverview | undefined
  readonly fiefRefusal: ApiRefusal | undefined
  readonly target: MarchTarget | undefined
  readonly isFounding: boolean
  readonly entries: MarchEntries
  readonly name: string
  readonly isSent: boolean
  readonly isWaiting: boolean
  readonly refusalLine: string | undefined
  readonly onEntriesChange: (entries: MarchEntries) => void
  readonly onNameChange: (name: string) => void
  readonly onSend: () => void
  readonly plotActionsOf: (map: ProvinceMap, plot: number) => ReadonlyArray<PlotAction>
}

interface ChosenMarch extends MarchTarget {
  readonly isFounding: boolean
}

const firstHours = '1'

const firstEntriesOf = (fief: FiefOverview): MarchEntries => {
  const atHome = unitsAtHomeOf(fief)
  const firstSentIndex = Math.max(
    0,
    partyKinds.findIndex((unit) => atHome[unit] > 0),
  )
  return {
    units: byUnitKind((unit) => (partyKinds.indexOf(unit) === firstSentIndex ? '1' : '0')),
    hours: firstHours,
  }
}

const unopenedEntries: MarchEntries = { units: byUnitKind(() => '0'), hours: firstHours }

const isSameChoice = (
  chosen: ChosenMarch | undefined,
  map: ProvinceMap,
  plot: number,
  isFounding: boolean,
): boolean =>
  chosen?.province === map.province && chosen.plot === plot && chosen.isFounding === isFounding

export function useMapMarch(
  apiClient: ApiClient,
  fiefId: string,
  map: ProvinceMap | undefined,
  onFoundingSent: () => void,
): MapMarch {
  const fief = useMapFief(apiClient, fiefId)
  const overview = fief.state.kind === 'read' ? fief.state.overview : undefined
  const [chosen, setChosen] = useState<ChosenMarch>()
  const [entries, setEntries] = useState(unopenedEntries)
  const [name, setName] = useState('')
  const [isSent, setIsSent] = useState(false)
  const adoptSent = (answered: FiefOverview): void => {
    fief.adopt(answered)
    setChosen(undefined)
    setIsSent(true)
    if (answered.march?.order === 'found') {
      onFoundingSent()
    }
  }
  const march = useMarch(apiClient, fiefId, adoptSent, overview?.readAt)
  const shownProvince = map?.province
  const target = chosen?.province === shownProvince ? chosen : undefined

  useEffect(() => {
    if (shownProvince !== undefined) {
      setChosen((open) => (open?.province === shownProvince ? open : undefined))
    }
  }, [shownProvince])

  const toggle = (
    map: ProvinceMap,
    plot: number,
    camp: PlotCamp | null,
    isFounding: boolean,
    fiefRead: FiefOverview,
  ): void => {
    setIsSent(false)
    if (isSameChoice(target, map, plot, isFounding)) {
      setChosen(undefined)
      return
    }
    setEntries(firstEntriesOf(fiefRead))
    setName(copy.founding.proposedName(fiefRead.name, map.terrain))
    setChosen({ province: map.province, plot, terrain: map.terrain, camp, isFounding })
  }

  const onSend = (): void => {
    if (target === undefined) {
      return
    }
    const { province, plot } = target
    if (target.isFounding) {
      march.found({ province, plot, name: name.trim() })
      return
    }
    const units = byUnitKind((unit) => Number(entries.units[unit]))
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
    isFounding: boolean,
    fiefRead: FiefOverview,
  ): PlotAction => {
    const [label, accessibleName] = isFounding
      ? [copy.founding.found, copy.founding.foundOn(plot)]
      : camp === null
        ? [copy.march.send, copy.march.sendTo(plot)]
        : [copy.march.attack, copy.march.attackTo(plot)]
    return {
      label,
      accessibleName,
      isExpanded: isSameChoice(target, shown, plot, isFounding),
      onToggle: () => toggle(shown, plot, camp, isFounding, fiefRead),
    }
  }

  const plotActionsOf = (shown: ProvinceMap, plot: number): ReadonlyArray<PlotAction> => {
    if (overview === undefined) {
      return []
    }
    const camp = shown.plots.find((each) => each.plot === plot)?.camp ?? null
    const party = actionOf(shown, plot, camp, false, overview)
    return camp === null ? [party, actionOf(shown, plot, camp, true, overview)] : [party]
  }

  return {
    overview,
    fiefRefusal: fief.state.kind === 'refused' ? fief.state.refusal : undefined,
    target,
    isFounding: target?.isFounding === true,
    entries,
    name,
    isSent,
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
