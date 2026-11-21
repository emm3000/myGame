import { createFileRoute, Outlet, redirect, useLocation } from '@tanstack/react-router'
import { type ReactElement, useMemo } from 'react'
import { PlayerCopyContext } from '../copy/PlayerCopyContext'
import { playerCopyOf } from '../copy/playerCopyOf'
import { LiveRegion } from '../design-system/LiveRegion'
import { useFocusTarget } from '../focus/useFocusTarget'
import { AppShell } from '../shell/AppShell'
import { registeredLineOf } from '../town/registeredLineOf'
import { TownContext } from '../town/TownContext'
import { TownStatus } from '../town/TownStatus'
import { useLessonFinish } from '../town/useLessonFinish'
import { useTown } from '../town/useTown'
import { useResendVerification } from '../verification/useResendVerification'

function SignedInLayout(): ReactElement {
  const { apiClient, player } = Route.useRouteContext()
  const verification = useResendVerification(apiClient)
  const town = useTown(apiClient)
  const live = town.state.kind === 'live' ? town.state : undefined
  const liveTown = live?.town
  const pathname = useLocation({ select: (location) => location.pathname })
  const lessonFinish = useLessonFinish(liveTown?.overview, pathname)
  const shellHeader = useFocusTarget<HTMLElement>()
  const { scaffold, chromePhase } = liveTown?.overview ?? player
  const copy = useMemo(() => playerCopyOf({ scaffold, chromePhase }), [scaffold, chromePhase])

  return (
    <TownContext value={town}>
      <PlayerCopyContext value={copy}>
        <AppShell
          player={player}
          verification={verification}
          town={liveTown?.overview}
          ringCountBefore={live?.registered.retainedWords?.countBefore}
          isTownHome={pathname === '/'}
          headerRef={shellHeader.ref}
          townStatus={
            <>
              <TownStatus
                town={liveTown}
                finish={lessonFinish}
                onFocusAfterClose={shellHeader.focus}
              />
              <LiveRegion
                line={live === undefined ? '' : registeredLineOf(copy, live.registered)}
                sequence={live?.readSequence ?? 0}
              />
            </>
          }
        >
          <Outlet />
        </AppShell>
      </PlayerCopyContext>
    </TownContext>
  )
}

export const Route = createFileRoute('/_signedIn')({
  ssr: false,
  beforeLoad: async ({ context }) => {
    const player = await context.apiClient.currentPlayer()
    if (player === undefined) {
      throw redirect({ to: '/sign-in' })
    }
    return { player }
  },
  component: SignedInLayout,
})
