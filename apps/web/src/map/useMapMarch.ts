import type { FiefOverview, ProvinceMap } from '@mygame/contracts'
import { useEffect, useState } from 'react'
import type { ApiClient, ApiRefusal } from '../api/apiClient'
import { copy } from '../copy'
import type { PlotAction } from '../design-system/PlotTile'
import type { MarchEntries, MarchTarget } from './marchFormOf'
import { useMapFief } from './useMapFief'
import { useMarch } from './useMarch'

export interface MapMarch {
  readonly overview: FiefOverview | undefined
  readonly fiefRefusal: ApiRefusal | undefined
  readonly target: MarchTarget | undefined
  readonly entries: MarchEntries
  readonly isSent: boolean
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
  const [isSent, setIsSent] = useState(false)
  const adoptSent = (answered: FiefOverview): void => {
    fief.adopt(answered)
    setChosen(undefined)
    setIsSent(true)
  }
  const march = useMarch(apiClient, adoptSent, overview?.readAt)
  const shownProvince = map?.province
  const target = chosen?.province === shownProvince ? chosen : undefined

  useEffect(() => {
    if (shownProvince !== undefined) {
      setChosen((open) => (open?.province === shownProvince ? open : undefined))
    }
  }, [shownProvince])

  const toggle = (map: ProvinceMap, plot: number): void => {
    setIsSent(false)
    setChosen(
      isSameTarget(target, map, plot)
        ? undefined
        : { province: map.province, plot, terrain: map.terrain },
    )
  }

  return {
    overview,
    fiefRefusal: fief.state.kind === 'refused' ? fief.state.refusal : undefined,
    target,
    entries,
    isSent,
    isWaiting: march.isWaiting,
    refusal: march.refusal,
    onEntriesChange: setEntries,
    onSend: () => {
      if (target !== undefined) {
        march.send({
          province: target.province,
          plot: target.plot,
          infantry: Number(entries.infantry),
          stayHours: Number(entries.hours),
        })
      }
    },
    plotActionOf: (shown, plot) =>
      overview === undefined
        ? undefined
        : {
            label: copy.march.send,
            accessibleName: copy.march.sendTo(plot),
            isExpanded: isSameTarget(target, shown, plot),
            onToggle: () => toggle(shown, plot),
          },
  }
}
