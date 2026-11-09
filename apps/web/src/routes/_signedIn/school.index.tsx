import { townLoading } from '@mygame/catalog'
import { createFileRoute, Navigate } from '@tanstack/react-router'
import type { ReactElement } from 'react'
import type { ApiClient } from '../../api/apiClient'
import { LoadingSkeleton, type LoadingSkeletonProps } from '../../design-system/LoadingSkeleton'
import { SchoolScreen } from '../../school/SchoolScreen'
import { SchoolTitled } from '../../school/SchoolTitled'
import { useSchoolLessons } from '../../school/useSchoolLessons'
import type { LiveTown } from '../../town/liveTown'
import { TownReadFailed } from '../../town/TownReadFailed'
import { useLayoutTown } from '../../town/useLayoutTown'
import type { TownHandle } from '../../town/useTown'

function SchoolPage({
  apiClient,
  town,
  adopt,
}: {
  readonly apiClient: ApiClient
  readonly town: LiveTown
  readonly adopt: TownHandle['adopt']
}): ReactElement {
  const lessons = useSchoolLessons(apiClient, adopt, town.overview.readAt)
  return <SchoolScreen town={town} lessons={lessons} />
}

const schoolSkeletonGroups: LoadingSkeletonProps['groups'] = [
  ['place-card', 'thumbnail', 'action'],
  ['thumbnail', 'thumbnail', 'thumbnail'],
]

function SchoolAnswer({
  apiClient,
  town,
}: {
  readonly apiClient: ApiClient
  readonly town: TownHandle
}): ReactElement | null {
  switch (town.state.kind) {
    case 'loading':
      return null
    case 'noTown':
      return <Navigate to="/" />
    case 'refused':
      return (
        <SchoolTitled>
          <TownReadFailed refusal={town.state.refusal} onRetry={town.reread} />
        </SchoolTitled>
      )
    case 'live':
      return <SchoolPage apiClient={apiClient} town={town.state.town} adopt={town.adopt} />
    default: {
      const unreachable: never = town.state
      return unreachable
    }
  }
}

function SchoolRoute(): ReactElement {
  const { apiClient } = Route.useRouteContext()
  const town = useLayoutTown()
  return (
    <LoadingSkeleton
      isLoading={town.state.kind === 'loading'}
      line={townLoading()}
      groups={schoolSkeletonGroups}
      Frame={SchoolTitled}
    >
      <SchoolAnswer apiClient={apiClient} town={town} />
    </LoadingSkeleton>
  )
}

export const Route = createFileRoute('/_signedIn/school/')({
  component: SchoolRoute,
})
