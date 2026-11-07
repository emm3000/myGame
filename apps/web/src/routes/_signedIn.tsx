import { createFileRoute, Outlet, redirect, useLocation, useParams } from '@tanstack/react-router'
import type { ReactElement } from 'react'
import { LiveRegion } from '../design-system/LiveRegion'
import { useFocusTarget } from '../focus/useFocusTarget'
import { HintsContext } from '../hints/HintsContext'
import { useHints } from '../hints/useHints'
import { AppShell } from '../shell/AppShell'
import { useFiefList } from '../shell/useFiefList'
import { registeredLineOf } from '../town/registeredLineOf'
import { TownContext } from '../town/TownContext'
import { TownStatus } from '../town/TownStatus'
import { useLessonFinish } from '../town/useLessonFinish'
import { useTown } from '../town/useTown'
import { useResendVerification } from '../verification/useResendVerification'

function SignedInLayout(): ReactElement {
  const { apiClient, player } = Route.useRouteContext()
  const verification = useResendVerification(apiClient)
  const { fiefId } = useParams({ strict: false })
  const fiefs = useFiefList(apiClient)
  const hints = useHints(apiClient, player.seenHints)
  const town = useTown(apiClient)
  const live = town.state.kind === 'live' ? town.state : undefined
  const liveTown = live?.town
  const pathname = useLocation({ select: (location) => location.pathname })
  const lessonFinish = useLessonFinish(liveTown?.overview, pathname)
  const shellHeader = useFocusTarget<HTMLElement>()

  return (
    <HintsContext value={hints}>
      <TownContext value={town}>
        <AppShell
          player={player}
          fiefId={fiefId}
          fiefs={fiefs}
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
                line={live === undefined ? '' : registeredLineOf(live.registered)}
                sequence={live?.readSequence ?? 0}
              />
            </>
          }
        >
          <Outlet />
        </AppShell>
      </TownContext>
    </HintsContext>
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
