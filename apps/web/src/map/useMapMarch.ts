import type { FiefOverview, ProvinceMap } from '@mygame/contracts'
import { useEffect, useState } from 'react'
import type { ApiClient, ApiRefusal } from '../api/apiClient'
import { copy } from '../copy'
import type { PlotAction } from '../design-system/PlotTile'
import type { MarchEntries, MarchTarget, PlotCamp } from './marchFormOf'
import { useMapFief } from './useMapFief'
import { useMarch } from './useMarch'

export interface MapMarch {
  readonly overview: FiefOverview | undefined
  readonly fiefRefusal: ApiRefusal | undefined
  readonly target: MarchTarget | undefined
  readonly entries: MarchEntries
  readonly sentTo: MarchTarget | undefined
  readonly isWaiting: boolean
  readonly refusal: ApiRefusal | undefined
  readonly onEntriesChange: (entries: MarchEntries) => void
  readonly onSend: () => void
  readonly plotActionOf: (map: ProvinceMap, plot: number) => PlotAction | undefined
}

const firstEntries: MarchEntries = { infantry: '1', hours: '1' }

const isSameTarget = (target: MarchTarget | undefined, map: ProvinceMap, plot: number): boolean =>
  target?.province === map.province && target.plot === plot

export function useMapMarch(apiClient: ApiClient, map: ProvinceMap | undefined): MapMarch {
  const fief = useMapFief(apiClient)
  const overview = fief.state.kind === 'read' ? fief.state.overview : undefined
  const [chosen, setChosen] = useState<MarchTarget>()
  const [entries, setEntries] = useState(firstEntries)
  const [sentTo, setSentTo] = useState<MarchTarget>()
  const adoptSent = (answered: FiefOverview): void => {
    fief.adopt(answered)
    setSentTo(chosen)
    setChosen(undefined)
  }
  const march = useMarch(apiClient, adoptSent, overview?.readAt)
  const shownProvince = map?.province
  const target = chosen?.province === shownProvince ? chosen : undefined

  useEffect(() => {
    if (shownProvince !== undefined) {
      setChosen((open) => (open?.province === shownProvince ? open : undefined))
    }
  }, [shownProvince])

  const toggle = (map: ProvinceMap, plot: number, camp: PlotCamp | null): void => {
    setSentTo(undefined)
    setChosen(
      isSameTarget(target, map, plot)
        ? undefined
        : { province: map.province, plot, terrain: map.terrain, camp },
    )
  }

  const onSend = (): void => {
    if (target === undefined) {
      return
    }
    const { province, plot } = target
    const infantry = Number(entries.infantry)
    if (target.camp === null) {
      march.send({ province, plot, infantry, stayHours: Number(entries.hours) })
      return
    }
    march.attack({ province, plot, infantry })
  }

  const plotActionOf = (shown: ProvinceMap, plot: number): PlotAction | undefined => {
    if (overview === undefined) {
      return undefined
    }
    const camp = shown.plots.find((each) => each.plot === plot)?.camp ?? null
    return {
      label: camp === null ? copy.march.send : copy.march.attack,
      accessibleName: camp === null ? copy.march.sendTo(plot) : copy.march.attackTo(plot),
      isExpanded: isSameTarget(target, shown, plot),
      onToggle: () => toggle(shown, plot, camp),
    }
  }

  return {
    overview,
    fiefRefusal: fief.state.kind === 'refused' ? fief.state.refusal : undefined,
    target,
    entries,
    sentTo,
    isWaiting: march.isWaiting,
    refusal: march.refusal,
    onEntriesChange: setEntries,
    onSend,
    plotActionOf,
  }
}
