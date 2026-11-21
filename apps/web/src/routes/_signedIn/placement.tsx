import { createFileRoute } from '@tanstack/react-router'
import type { ReactElement } from 'react'
import { SignOutColumn } from '../../auth/SignOutColumn'
import { usePlayerCopy } from '../../copy/usePlayerCopy'
import { LoadingSkeleton, type LoadingSkeletonProps } from '../../design-system/LoadingSkeleton'
import { PlacementScreen, PlacementTitled } from '../../placement/PlacementScreen'
import { usePlacement } from '../../placement/usePlacement'

const placementSkeletonGroups: LoadingSkeletonProps['groups'] = [
  ['place-card', 'secondary', 'secondary', 'action'],
]

function PlacementRoute(): ReactElement {
  const { apiClient } = Route.useRouteContext()
  const placement = usePlacement(apiClient)
  const copy = usePlayerCopy()
  return (
    <SignOutColumn apiClient={apiClient}>
      <LoadingSkeleton
        isLoading={placement.view.kind === 'loading'}
        line={copy.fixedCopy((catalog) => catalog.placementLoading())}
        groups={placementSkeletonGroups}
        Frame={PlacementTitled}
      >
        <PlacementScreen placement={placement} />
      </LoadingSkeleton>
    </SignOutColumn>
  )
}

export const Route = createFileRoute('/_signedIn/placement')({
  component: PlacementRoute,
})
