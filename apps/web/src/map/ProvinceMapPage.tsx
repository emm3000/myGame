import { useNavigate } from '@tanstack/react-router'
import type { ReactElement } from 'react'
import type { ApiClient } from '../api/apiClient'
import { MapScreen } from './MapScreen'
import { useProvinceMap } from './useProvinceMap'

export interface ProvinceMapPageProps {
  readonly apiClient: ApiClient
  readonly province: number | undefined
}

export function ProvinceMapPage({ apiClient, province }: ProvinceMapPageProps): ReactElement {
  const navigate = useNavigate()
  const state = useProvinceMap(apiClient, province)

  const browse = (target: number): void => {
    void navigate({ to: '/mapa/$province', params: { province: String(target) } })
  }

  return <MapScreen state={state} onBrowse={browse} />
}
