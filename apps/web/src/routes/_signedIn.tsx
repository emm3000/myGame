import { createFileRoute, Outlet, redirect, useNavigate, useParams } from '@tanstack/react-router'
import type { ReactElement } from 'react'
import { AppShell } from '../shell/AppShell'
import { useResendVerification } from '../verification/useResendVerification'

function SignedInLayout(): ReactElement {
  const { apiClient, player } = Route.useRouteContext()
  const verification = useResendVerification(apiClient)
  const navigate = useNavigate()
  const { fiefId } = useParams({ strict: false })

  const signOut = async (): Promise<void> => {
    await apiClient.signOut()
    await navigate({ to: '/sign-in' })
  }

  return (
    <AppShell player={player} fiefId={fiefId} verification={verification} onSignOut={signOut}>
      <Outlet />
    </AppShell>
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
