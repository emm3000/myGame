import { createFileRoute } from '@tanstack/react-router'
import { AppShell } from '../shell/AppShell'

export const Route = createFileRoute('/')({
  component: AppShell,
})
