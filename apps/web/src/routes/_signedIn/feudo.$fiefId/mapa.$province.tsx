import { ProvinceMapRequestSchema } from '@mygame/contracts'
import { createFileRoute } from '@tanstack/react-router'
import type { ReactElement } from 'react'
import { MapScreen } from '../../../map/MapScreen'
import { ProvinceMapPage } from '../../../map/ProvinceMapPage'

const ignoreBrowse = (): void => undefined

const noPlotActions = (): ReadonlyArray<never> => []

function NumberedProvincePage(): ReactElement {
  const { apiClient } = Route.useRouteContext()
  const params = Route.useParams()
  const request = ProvinceMapRequestSchema.safeParse(params)
  if (!request.success) {
    return (
      <MapScreen
        fiefId={params.fiefId}
        state={{ kind: 'refused', refusal: 'ProvinceNotFound' }}
        onBrowse={ignoreBrowse}
        plotActionsOf={noPlotActions}
        columns={2}
        marchPanel={undefined}
        fiefRefusalLine={undefined}
        hint={undefined}
      />
    )
  }
  return (
    <ProvinceMapPage
      apiClient={apiClient}
      fiefId={params.fiefId}
      province={request.data.province}
    />
  )
}

export const Route = createFileRoute('/_signedIn/feudo/$fiefId/mapa/$province')({
  component: NumberedProvincePage,
})
