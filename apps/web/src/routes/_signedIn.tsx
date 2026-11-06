import {
  createFileRoute,
  Outlet,
  redirect,
  useLocation,
  useNavigate,
  useParams,
} from '@tanstack/react-router'
import type { ReactElement } from 'react'
import { useFocusTarget } from '../focus/useFocusTarget'
import { HintsContext } from '../hints/HintsContext'
import { useHints } from '../hints/useHints'
import { AppShell } from '../shell/AppShell'
import { useFiefList } from '../shell/useFiefList'
import { dueCountOf } from '../town/dueCountOf'
import { TownContext } from '../town/TownContext'
import { TownStatus } from '../town/TownStatus'
import { useLessonFinish } from '../town/useLessonFinish'
import { useTown } from '../town/useTown'
import { useResendVerification } from '../verification/useResendVerification'

function SignedInLayout(): ReactElement {
  const { apiClient, player } = Route.useRouteContext()
  const verification = useResendVerification(apiClient)
  const navigate = useNavigate()
  const { fiefId } = useParams({ strict: false })
  const fiefs = useFiefList(apiClient)
  const hints = useHints(apiClient, player.seenHints)
  const town = useTown(apiClient)
  const liveTown = town.state.kind === 'live' ? town.state.town : undefined
  const pathname = useLocation({ select: (location) => location.pathname })
  const lessonFinish = useLessonFinish(liveTown?.overview, pathname)
  const shellTitle = useFocusTarget<HTMLHeadingElement>()

  const signOut = async (): Promise<void> => {
    await apiClient.signOut()
    await navigate({ to: '/sign-in' })
  }

  return (
    <HintsContext value={hints}>
      <TownContext value={town}>
        <AppShell
          player={player}
          fiefId={fiefId}
          fiefs={fiefs}
          verification={verification}
          dueCount={dueCountOf(liveTown)}
          titleRef={shellTitle.ref}
          townStatus={
            <TownStatus
              town={liveTown}
              finish={lessonFinish}
              onFocusAfterClose={shellTitle.focus}
            />
          }
          onSignOut={signOut}
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
