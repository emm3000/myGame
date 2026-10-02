import { useNavigate } from '@tanstack/react-router'
import type { ReactElement } from 'react'
import type { ApiClient } from '../api/apiClient'
import { MapMarchPanel } from './MapMarchPanel'
import { MapScreen } from './MapScreen'
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
  const state = useProvinceMap(apiClient, fiefId, province)
  const march = useMapMarch(apiClient, fiefId, state.kind === 'read' ? state.map : undefined)

  const browse = (target: number): void => {
    void navigate({
      to: '/feudo/$fiefId/mapa/$province',
      params: { fiefId, province: String(target) },
    })
  }

  return (
    <MapScreen
      fiefId={fiefId}
      state={state}
      onBrowse={browse}
      plotActionOf={march.plotActionOf}
      marchPanel={<MapMarchPanel march={march} />}
    />
  )
}
