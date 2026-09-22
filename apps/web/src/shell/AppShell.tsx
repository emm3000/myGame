import type { ReactElement } from 'react'
import { copy } from '../copy'

export function AppShell(): ReactElement {
  return (
    <div className="min-h-screen bg-surface text-ink">
      <header className="border-b border-line bg-surface-raised px-4 py-4 md:px-8">
        <h1 className="m-0 font-display text-display-xl text-umber">{copy.shell.title}</h1>
      </header>
      <main className="px-4 py-6 font-body text-body text-ink-muted md:px-8">
        <p>{copy.shell.welcome}</p>
      </main>
    </div>
  )
}
