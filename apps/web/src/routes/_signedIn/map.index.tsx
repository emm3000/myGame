import { createFileRoute } from '@tanstack/react-router'
import type { ReactElement } from 'react'
import { MapPage } from '../../map/MapPage'

function OwnAreaRoute(): ReactElement {
  const { apiClient } = Route.useRouteContext()
  return <MapPage apiClient={apiClient} area={undefined} />
}

export const Route = createFileRoute('/_signedIn/map/')({
  component: OwnAreaRoute,
})
