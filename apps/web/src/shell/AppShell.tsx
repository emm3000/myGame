import type { Player } from '@mygame/contracts'
import { Link, type LinkProps } from '@tanstack/react-router'
import type { ReactElement, ReactNode } from 'react'
import { copy } from '../copy'
import { Button } from '../design-system/Button'
import type { ResendVerification } from '../verification/useResendVerification'
import { VerificationBanner } from '../verification/VerificationBanner'

export interface AppShellProps {
  readonly player: Player
  readonly fiefId: string | undefined
  readonly verification: ResendVerification
  readonly onSignOut: () => void
  readonly children: ReactNode
}

interface Screen {
  readonly to: NonNullable<LinkProps['to']>
  readonly label: string
  readonly isExact: boolean
}

const screens: ReadonlyArray<Screen> = [
  { to: '/feudo/$fiefId', label: copy.shell.navigation.fief, isExact: true },
  { to: '/feudo/$fiefId/mapa', label: copy.shell.navigation.map, isExact: false },
  { to: '/feudo/$fiefId/cronica', label: copy.shell.navigation.chronicle, isExact: true },
]

const linkClass =
  'flex items-center border-b-3 px-3 py-3 font-utility text-button no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-line-strong'

function ScreenLink({
  to,
  label,
  isExact,
  fiefId,
}: Screen & { readonly fiefId: string }): ReactElement {
  return (
    <Link
      to={to}
      params={{ fiefId }}
      activeOptions={{ exact: isExact }}
      className={linkClass}
      activeProps={{ className: 'border-river font-bold text-river' }}
      inactiveProps={{ className: 'border-transparent text-ink-muted' }}
    >
      {label}
    </Link>
  )
}

export function AppShell({
  player,
  fiefId,
  verification,
  onSignOut,
  children,
}: AppShellProps): ReactElement {
  return (
    <div className="min-h-screen bg-surface text-ink">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-line bg-surface-raised px-4 py-4 md:px-8">
        <h1 className="m-0 font-display text-display-xl text-umber">{copy.shell.title}</h1>
        <div className="flex grow items-center gap-4 md:grow-0">
          {fiefId === undefined ? null : (
            <nav className="flex">
              <ul className="m-0 flex list-none gap-1 p-0">
                {screens.map((screen) => (
                  <li key={screen.to} className="flex">
                    <ScreenLink {...screen} fiefId={fiefId} />
                  </li>
                ))}
              </ul>
            </nav>
          )}
          <span className="ml-auto flex">
            <Button type="button" tone="quiet" onClick={onSignOut}>
              {copy.shell.signOut}
            </Button>
          </span>
        </div>
      </header>
      <main className="flex flex-col gap-6 px-4 py-6 font-body text-body text-ink-muted md:px-8">
        {player.emailVerified ? null : <VerificationBanner {...verification} />}
        <div>{children}</div>
      </main>
    </div>
  )
}
