import { createFileRoute, Outlet, redirect, useNavigate } from '@tanstack/react-router'
import type { ReactElement } from 'react'
import { AppShell } from '../shell/AppShell'

function SignedInLayout(): ReactElement {
  const { apiClient } = Route.useRouteContext()
  const navigate = useNavigate()

  const signOut = async (): Promise<void> => {
    await apiClient.signOut()
    await navigate({ to: '/sign-in' })
  }

  return (
    <AppShell onSignOut={signOut}>
      <Outlet />
    </AppShell>
  )
}

export const Route = createFileRoute('/_signedIn')({
  ssr: false,
  beforeLoad: async ({ context }) => {
    if ((await context.apiClient.currentPlayer()) === undefined) {
      throw redirect({ to: '/sign-in' })
    }
  },
  component: SignedInLayout,
})
