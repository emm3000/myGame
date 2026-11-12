import { townLoading } from '@mygame/catalog'
import { createFileRoute } from '@tanstack/react-router'
import { Fragment, type ReactElement } from 'react'
import type { ApiClient } from '../../api/apiClient'
import { SignOutColumn } from '../../auth/SignOutColumn'
import { LoadingSkeleton, type LoadingSkeletonProps } from '../../design-system/LoadingSkeleton'
import type { LiveTown } from '../../town/liveTown'
import { NameTownScreen } from '../../town/NameTownScreen'
import type { Registered } from '../../town/registeredBetween'
import { TownHome } from '../../town/TownHome'
import { TownReadFailed } from '../../town/TownReadFailed'
import { useFoundTown } from '../../town/useFoundTown'
import { useLayoutTown } from '../../town/useLayoutTown'
import type { TownHandle } from '../../town/useTown'
import { useTownGuidance } from '../../town/useTownGuidance'
import { useTownHiring } from '../../town/useTownHiring'
import { useTownWork } from '../../town/useTownWork'

function NameTownPage({
  apiClient,
  town,
}: {
  readonly apiClient: ApiClient
  readonly town: TownHandle
}): ReactElement {
  const founding = useFoundTown(apiClient, town.adopt)
  return (
    <NameTownScreen
      name={founding.name}
      isSubmitting={founding.isSubmitting}
      refusal={founding.refusal}
      onNameChange={founding.setName}
      onSubmit={founding.submit}
      onGoToTown={town.reread}
    />
  )
}

function TownHomePage({
  apiClient,
  town,
  registered,
  readSequence,
  adopt,
}: {
  readonly apiClient: ApiClient
  readonly town: LiveTown
  readonly registered: Registered
  readonly readSequence: number
  readonly adopt: TownHandle['adopt']
}): ReactElement {
  const work = useTownWork(apiClient, adopt, town.overview.readAt)
  const hiring = useTownHiring(apiClient, adopt, town.overview.readAt)
  const guidance = useTownGuidance(apiClient, town.overview, readSequence)
  return (
    <TownHome town={town} registered={registered} work={work} hiring={hiring} guidance={guidance} />
  )
}

const townSkeletonGroups: LoadingSkeletonProps['groups'] = [
  ['place-card', 'action'],
  ['place-card', 'thumbnail'],
  ['thumbnail'],
  ['place-card'],
]

function TownAnswer({
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
      return (
        <SignOutColumn apiClient={apiClient}>
          <NameTownPage apiClient={apiClient} town={town} />
        </SignOutColumn>
      )
    case 'refused':
      return (
        <SignOutColumn apiClient={apiClient}>
          <TownReadFailed refusal={town.state.refusal} onRetry={town.reread} />
        </SignOutColumn>
      )
    case 'live':
      return (
        <TownHomePage
          apiClient={apiClient}
          town={town.state.town}
          registered={town.state.registered}
          readSequence={town.state.readSequence}
          adopt={town.adopt}
        />
      )
    default: {
      const unreachable: never = town.state
      return unreachable
    }
  }
}

function TownPage(): ReactElement {
  const { apiClient } = Route.useRouteContext()
  const town = useLayoutTown()
  return (
    <LoadingSkeleton
      isLoading={town.state.kind === 'loading'}
      line={townLoading()}
      groups={townSkeletonGroups}
      Frame={Fragment}
    >
      <TownAnswer apiClient={apiClient} town={town} />
    </LoadingSkeleton>
  )
}

export const Route = createFileRoute('/_signedIn/')({
  component: TownPage,
})
