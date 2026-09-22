import type { ReactElement, ReactNode } from 'react'
import { copy } from '../copy'
import { Button } from '../design-system/Button'

export interface AppShellProps {
  readonly onSignOut: () => void
  readonly children: ReactNode
}

export function AppShell({ onSignOut, children }: AppShellProps): ReactElement {
  return (
    <div className="min-h-screen bg-surface text-ink">
      <header className="flex items-center justify-between gap-4 border-b border-line bg-surface-raised px-4 py-4 md:px-8">
        <h1 className="m-0 font-display text-display-xl text-umber">{copy.shell.title}</h1>
        <Button type="button" tone="quiet" onClick={onSignOut}>
          {copy.shell.signOut}
        </Button>
      </header>
      <main className="px-4 py-6 font-body text-body text-ink-muted md:px-8">{children}</main>
    </div>
  )
}
