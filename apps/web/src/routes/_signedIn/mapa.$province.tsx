import { ProvinceMapRequestSchema } from '@mygame/contracts'
import { createFileRoute } from '@tanstack/react-router'
import type { ReactElement } from 'react'
import { MapScreen } from '../../map/MapScreen'
import { ProvinceMapPage } from '../../map/ProvinceMapPage'

const ignoreBrowse = (): void => undefined

const noPlotAction = (): undefined => undefined

function NumberedProvincePage(): ReactElement {
  const { apiClient } = Route.useRouteContext()
  const request = ProvinceMapRequestSchema.safeParse(Route.useParams())
  if (!request.success) {
    return (
      <MapScreen
        state={{ kind: 'refused', refusal: 'ProvinceNotFound' }}
        onBrowse={ignoreBrowse}
        plotActionOf={noPlotAction}
        marchPanel={null}
      />
    )
  }
  return <ProvinceMapPage apiClient={apiClient} province={request.data.province} />
}

export const Route = createFileRoute('/_signedIn/mapa/$province')({
  component: NumberedProvincePage,
})
