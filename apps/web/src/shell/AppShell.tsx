import {
  reportReviewsDue,
  shellNavigationChronicle,
  shellNavigationMap,
  shellNavigationReport,
  shellNavigationTown,
  shellSignOut,
  shellTitle,
} from '@mygame/catalog'
import type { Player } from '@mygame/contracts'
import { Link, type LinkProps } from '@tanstack/react-router'
import type { ReactElement, ReactNode, RefObject } from 'react'
import { Button } from '../design-system/Button'
import { focusTargetClass } from '../design-system/focusTargetClass'
import { formatQuantity } from '../design-system/formatQuantity'
import type { ResendVerification } from '../verification/useResendVerification'
import { VerificationBanner } from '../verification/VerificationBanner'
import { FiefSwitcher } from './FiefSwitcher'
import type { FiefEntries } from './useFiefList'

export interface AppShellProps {
  readonly player: Player
  readonly fiefId: string | undefined
  readonly fiefs: FiefEntries | undefined
  readonly verification: ResendVerification
  readonly dueCount: number
  readonly titleRef: RefObject<HTMLHeadingElement | null>
  readonly townStatus: ReactNode
  readonly onSignOut: () => void
  readonly children: ReactNode
}

interface Screen {
  readonly to: NonNullable<LinkProps['to']>
  readonly label: string
  readonly isExact: boolean
}

const townScreens: ReadonlyArray<Screen> = [
  { to: '/', label: shellNavigationTown(), isExact: true },
  { to: '/report', label: shellNavigationReport(), isExact: true },
]

const fiefScreens: ReadonlyArray<Screen> = [
  { to: '/feudo/$fiefId/mapa', label: shellNavigationMap(), isExact: false },
  { to: '/feudo/$fiefId/cronica', label: shellNavigationChronicle(), isExact: true },
]

const linkClass =
  'flex items-center border-b-3 px-3 py-3 font-sans text-button no-underline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus'

const activeProps = { className: 'border-action font-bold text-action' }
const inactiveProps = { className: 'border-transparent text-ink-muted' }

function DueCount({ count }: { readonly count: number }): ReactElement {
  const figure = formatQuantity(count)
  return (
    <>
      {' '}
      <span className="sr-only">{reportReviewsDue({ count: figure })}</span>
      <span
        aria-hidden="true"
        className="ml-2 rounded-pill bg-badge px-2 font-sans text-label text-on-badge tabular-nums"
      >
        {figure}
      </span>
    </>
  )
}

function TownScreenLink({
  to,
  label,
  isExact,
  dueCount,
}: Screen & { readonly dueCount: number }): ReactElement {
  return (
    <Link
      to={to}
      activeOptions={{ exact: isExact }}
      className={linkClass}
      activeProps={activeProps}
      inactiveProps={inactiveProps}
    >
      {label}
      {to === '/report' && dueCount > 0 && <DueCount count={dueCount} />}
    </Link>
  )
}

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
      activeProps={activeProps}
      inactiveProps={inactiveProps}
    >
      {label}
    </Link>
  )
}

export function AppShell({
  player,
  fiefId,
  fiefs,
  verification,
  dueCount,
  titleRef,
  townStatus,
  onSignOut,
  children,
}: AppShellProps): ReactElement {
  return (
    <div className="min-h-screen bg-surface text-ink">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-line bg-surface-raised px-4 py-4 md:px-8">
        <h1
          ref={titleRef}
          tabIndex={-1}
          className={`m-0 font-sans text-title text-action ${focusTargetClass}`}
        >
          {shellTitle()}
        </h1>
        {fiefId === undefined || fiefs === undefined ? null : <FiefSwitcher fiefs={fiefs} />}
        <div className="flex grow items-center gap-4 md:grow-0">
          <nav className="flex">
            <ul className="m-0 flex list-none flex-wrap gap-1 p-0">
              {townScreens.map((screen) => (
                <li key={screen.to} className="flex">
                  <TownScreenLink {...screen} dueCount={dueCount} />
                </li>
              ))}
              {fiefId === undefined
                ? null
                : fiefScreens.map((screen) => (
                    <li key={screen.to} className="flex">
                      <ScreenLink {...screen} fiefId={fiefId} />
                    </li>
                  ))}
            </ul>
          </nav>
          <span className="ml-auto flex">
            <Button type="button" tone="quiet" onClick={onSignOut}>
              {shellSignOut()}
            </Button>
          </span>
        </div>
      </header>
      {townStatus}
      <main className="flex flex-col gap-6 px-4 py-6 font-sans text-body text-ink-muted md:px-8">
        {player.emailVerified ? null : <VerificationBanner {...verification} />}
        <div>{children}</div>
      </main>
    </div>
  )
}
