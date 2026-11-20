import { createFileRoute } from '@tanstack/react-router'
import type { ReactElement } from 'react'
import { SignOutColumn } from '../../auth/SignOutColumn'
import { SettingsScreen } from '../../settings/SettingsScreen'
import { useScaffoldSetting } from '../../settings/useScaffoldSetting'

function SettingsRoute(): ReactElement {
  const { apiClient, player } = Route.useRouteContext()
  const setting = useScaffoldSetting(apiClient, player.scaffold)
  return (
    <SignOutColumn apiClient={apiClient}>
      <SettingsScreen stored={setting.stored} change={setting.change} onPick={setting.pick} />
    </SignOutColumn>
  )
}

export const Route = createFileRoute('/_signedIn/settings')({
  component: SettingsRoute,
})
