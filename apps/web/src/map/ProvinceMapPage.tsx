import { useNavigate } from '@tanstack/react-router'
import type { ReactElement } from 'react'
import type { ApiClient } from '../api/apiClient'
import { copy } from '../copy'
import { useLayoutFief } from '../fief/useLayoutFief'
import { useFocusTarget } from '../focus/useFocusTarget'
import { hintFocusingAfterDismiss } from '../hints/hintFocusingAfterDismiss'
import { hintPropsOf } from '../hints/hintPropsOf'
import { marchesHintOf } from '../hints/marchesHintOf'
import { useLayoutHints } from '../hints/useLayoutHints'
import { MapMarchPanel } from './MapMarchPanel'
import { MapScreen } from './MapScreen'
import { useMapColumns } from './useMapColumns'
import { useMapMarch } from './useMapMarch'
import { useProvinceMap } from './useProvinceMap'

export interface ProvinceMapPageProps {
  readonly apiClient: ApiClient
  readonly fiefId: string
  readonly province: number | undefined
}

export function ProvinceMapPage({
  apiClient,
  fiefId,
  province,
}: ProvinceMapPageProps): ReactElement {
  const navigate = useNavigate()
  const fief = useLayoutFief()
  const hints = useLayoutHints()
  const { state, reread } = useProvinceMap(apiClient, fiefId, province)
  const provinceHeading = useFocusTarget<HTMLHeadingElement>()
  const columns = useMapColumns()
  const march = useMapMarch(
    apiClient,
    fiefId,
    state.kind === 'read' ? state.map : undefined,
    reread,
    provinceHeading.focus,
  )

  const browse = (target: number): void => {
    void navigate({
      to: '/feudo/$fiefId/mapa/$province',
      params: { fiefId, province: String(target) },
    })
  }

  const hint =
    fief.state.kind === 'live' ? marchesHintOf(fief.state.fief.overview, hints.hidden) : undefined
  return (
    <MapScreen
      fiefId={fiefId}
      state={state}
      onBrowse={browse}
      plotActionsOf={march.plotActionsOf}
      columns={columns}
      marchPanel={
        march.panelPlot === undefined
          ? undefined
          : { plot: march.panelPlot, content: <MapMarchPanel march={march} /> }
      }
      fiefRefusalLine={
        march.fiefRefusal === undefined ? undefined : copy.refusals[march.fiefRefusal]
      }
      hint={
        hint === undefined
          ? undefined
          : hintFocusingAfterDismiss(hintPropsOf(hint, hints), provinceHeading.focus)
      }
      provinceHeadingRef={provinceHeading.ref}
    />
  )
}
