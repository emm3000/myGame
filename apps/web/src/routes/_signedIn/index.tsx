import { townLoading } from '@mygame/catalog'
import { createFileRoute } from '@tanstack/react-router'
import type { ReactElement } from 'react'
import type { ApiClient } from '../../api/apiClient'
import { SignOutColumn } from '../../auth/SignOutColumn'
import { ReadingLine } from '../../design-system/ReadingLine'
import type { LiveTown } from '../../town/liveTown'
import { NameTownScreen } from '../../town/NameTownScreen'
import type { Registered } from '../../town/registeredBetween'
import { TownHome } from '../../town/TownHome'
import { TownReadFailed } from '../../town/TownReadFailed'
import { useFoundTown } from '../../town/useFoundTown'
import { useLayoutTown } from '../../town/useLayoutTown'
import type { TownHandle } from '../../town/useTown'
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
  adopt,
}: {
  readonly apiClient: ApiClient
  readonly town: LiveTown
  readonly registered: Registered
  readonly adopt: TownHandle['adopt']
}): ReactElement {
  const work = useTownWork(apiClient, adopt, town.overview.readAt)
  return <TownHome town={town} registered={registered} work={work} />
}

function TownPage(): ReactElement | null {
  const { apiClient } = Route.useRouteContext()
  const town = useLayoutTown()
  switch (town.state.kind) {
    case 'loading':
      return <ReadingLine line={townLoading()} />
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
          adopt={town.adopt}
        />
      )
    default: {
      const unreachable: never = town.state
      return unreachable
    }
  }
}

export const Route = createFileRoute('/_signedIn/')({
  component: TownPage,
})
