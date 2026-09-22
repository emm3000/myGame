import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_guest')({
  ssr: false,
  beforeLoad: async ({ context }) => {
    if ((await context.apiClient.currentPlayer()) !== undefined) {
      throw redirect({ to: '/' })
    }
  },
  component: Outlet,
})
