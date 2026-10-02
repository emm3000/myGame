import { createFileRoute } from '@tanstack/react-router'
import type { ReactElement } from 'react'
import { ProvinceMapPage } from '../../../map/ProvinceMapPage'

function OwnProvincePage(): ReactElement {
  const { apiClient } = Route.useRouteContext()
  const { fiefId } = Route.useParams()
  return <ProvinceMapPage apiClient={apiClient} fiefId={fiefId} province={undefined} />
}

export const Route = createFileRoute('/_signedIn/feudo/$fiefId/mapa/')({
  component: OwnProvincePage,
})
