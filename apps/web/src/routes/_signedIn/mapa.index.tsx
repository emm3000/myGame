import { createFileRoute } from '@tanstack/react-router'
import type { ReactElement } from 'react'
import { ProvinceMapPage } from '../../map/ProvinceMapPage'

function OwnProvincePage(): ReactElement {
  const { apiClient } = Route.useRouteContext()
  return <ProvinceMapPage apiClient={apiClient} province={undefined} />
}

export const Route = createFileRoute('/_signedIn/mapa/')({
  component: OwnProvincePage,
})
