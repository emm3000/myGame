import { townLoading } from '@mygame/catalog'
import { createFileRoute, Navigate } from '@tanstack/react-router'
import type { ReactElement } from 'react'
import type { ApiClient } from '../../api/apiClient'
import { ReadingLine } from '../../design-system/ReadingLine'
import { SchoolScreen } from '../../school/SchoolScreen'
import { useSchoolLessons } from '../../school/useSchoolLessons'
import type { LiveTown } from '../../town/liveTown'
import { TownReadFailed } from '../../town/TownReadStatus'
import { type TownHandle, useTown } from '../../town/useTown'

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

function SchoolRoute(): ReactElement {
  const { apiClient } = Route.useRouteContext()
  const town = useTown(apiClient)
  switch (town.state.kind) {
    case 'loading':
      return <ReadingLine line={townLoading()} />
    case 'noTown':
      return <Navigate to="/" />
    case 'refused':
      return <TownReadFailed refusal={town.state.refusal} onRetry={town.reread} />
    case 'live':
      return <SchoolPage apiClient={apiClient} town={town.state.town} adopt={town.adopt} />
    default: {
      const unreachable: never = town.state
      return unreachable
    }
  }
}

export const Route = createFileRoute('/_signedIn/school')({
  component: SchoolRoute,
})
