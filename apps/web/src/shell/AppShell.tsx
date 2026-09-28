import { Link, type LinkProps } from '@tanstack/react-router'
import type { ReactElement, ReactNode } from 'react'
import { copy } from '../copy'
import { Button } from '../design-system/Button'

export interface AppShellProps {
  readonly onSignOut: () => void
  readonly children: ReactNode
}

interface Screen {
  readonly to: NonNullable<LinkProps['to']>
  readonly label: string
}

const screens: ReadonlyArray<Screen> = [
  { to: '/', label: copy.shell.navigation.fief },
  { to: '/cronica', label: copy.shell.navigation.chronicle },
]

const linkClass =
  'flex items-center border-b-3 px-3 py-3 font-utility text-button no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-line-strong'

function ScreenLink({ to, label }: Screen): ReactElement {
  return (
    <Link
      to={to}
      activeOptions={{ exact: true }}
      className={linkClass}
      activeProps={{ className: 'border-river font-bold text-river' }}
      inactiveProps={{ className: 'border-transparent text-ink-muted' }}
    >
      {label}
    </Link>
  )
}

export function AppShell({ onSignOut, children }: AppShellProps): ReactElement {
  return (
    <div className="min-h-screen bg-surface text-ink">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-line bg-surface-raised px-4 py-4 md:px-8">
        <h1 className="m-0 font-display text-display-xl text-umber">{copy.shell.title}</h1>
        <nav className="flex grow items-center gap-4 md:grow-0">
          <ul className="m-0 flex list-none gap-1 p-0">
            {screens.map((screen) => (
              <li key={screen.to} className="flex">
                <ScreenLink {...screen} />
              </li>
            ))}
          </ul>
          <span className="ml-auto flex">
            <Button type="button" tone="quiet" onClick={onSignOut}>
              {copy.shell.signOut}
            </Button>
          </span>
        </nav>
      </header>
      <main className="px-4 py-6 font-body text-body text-ink-muted md:px-8">{children}</main>
    </div>
  )
}
