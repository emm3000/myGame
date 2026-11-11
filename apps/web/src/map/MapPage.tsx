import { mapLoading, townTryAgain } from '@mygame/catalog'
import { Navigate } from '@tanstack/react-router'
import type { ReactElement } from 'react'
import type { ApiClient } from '../api/apiClient'
import { LoadingSkeleton, type LoadingSkeletonProps } from '../design-system/LoadingSkeleton'
import { ReadFailed } from '../design-system/ReadFailed'
import { refusalLineOf } from '../refusals/refusalLineOf'
import type { LiveTown } from '../town/liveTown'
import { TownReadFailed } from '../town/TownReadFailed'
import { useLayoutTown } from '../town/useLayoutTown'
import type { TownHandle } from '../town/useTown'
import { AreaNotFound } from './AreaNotFound'
import { MapScreen } from './MapScreen'
import { MapTitled } from './MapTitled'
import { useJob } from './useJob'
import { type RegionMapHandle, useRegionMap } from './useRegionMap'

const mapSkeletonGroups: LoadingSkeletonProps['groups'] = [
  ['control', 'secondary', 'secondary', 'secondary'],
]

function LiveMap({
  apiClient,
  regionMap,
  town,
  adopt,
}: {
  readonly apiClient: ApiClient
  readonly regionMap: RegionMapHandle
  readonly town: LiveTown
  readonly adopt: TownHandle['adopt']
}): ReactElement | null {
  const job = useJob(apiClient, adopt, town.overview.readAt)
  const { state } = regionMap
  switch (state.kind) {
    case 'loading':
      return null
    case 'refused':
      return state.refusal === 'AreaNotFound' ? (
        <AreaNotFound />
      ) : (
        <ReadFailed
          message={refusalLineOf(state.refusal)}
          retryLabel={townTryAgain()}
          onRetry={regionMap.reread}
        />
      )
    case 'read':
      return <MapScreen map={state.map} town={town} job={job} />
    default: {
      const unreachable: never = state
      return unreachable
    }
  }
}

function MapAnswer({
  apiClient,
  regionMap,
  town,
}: {
  readonly apiClient: ApiClient
  readonly regionMap: RegionMapHandle
  readonly town: TownHandle
}): ReactElement | null {
  switch (town.state.kind) {
    case 'loading':
      return null
    case 'noTown':
      return <Navigate to="/" />
    case 'refused':
      return <TownReadFailed refusal={town.state.refusal} onRetry={town.reread} />
    case 'live':
      return (
        <LiveMap
          apiClient={apiClient}
          regionMap={regionMap}
          town={town.state.town}
          adopt={town.adopt}
        />
      )
    default: {
      const unreachable: never = town.state
      return unreachable
    }
  }
}

export function MapPage({
  apiClient,
  area,
}: {
  readonly apiClient: ApiClient
  readonly area: number | undefined
}): ReactElement {
  const town = useLayoutTown()
  const regionMap = useRegionMap(apiClient, area)
  const isLoading = town.state.kind === 'loading' || regionMap.state.kind === 'loading'
  return (
    <LoadingSkeleton
      isLoading={isLoading}
      line={mapLoading()}
      groups={mapSkeletonGroups}
      Frame={MapTitled}
    >
      <MapTitled>
        <MapAnswer apiClient={apiClient} regionMap={regionMap} town={town} />
      </MapTitled>
    </LoadingSkeleton>
  )
}
