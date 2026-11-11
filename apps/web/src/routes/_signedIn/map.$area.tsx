import { RegionMapRequestSchema } from '@mygame/contracts'
import { createFileRoute } from '@tanstack/react-router'
import type { ReactElement } from 'react'
import { AreaNotFound } from '../../map/AreaNotFound'
import { MapPage } from '../../map/MapPage'
import { MapTitled } from '../../map/MapTitled'

function AreaRoute(): ReactElement {
  const { apiClient } = Route.useRouteContext()
  const request = RegionMapRequestSchema.safeParse(Route.useParams())
  if (!request.success) {
    return (
      <MapTitled>
        <AreaNotFound />
      </MapTitled>
    )
  }
  return <MapPage apiClient={apiClient} area={request.data.area} />
}

export const Route = createFileRoute('/_signedIn/map/$area')({
  component: AreaRoute,
})
