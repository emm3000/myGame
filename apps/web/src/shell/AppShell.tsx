import { shellNavigationTown, townLabelCity, townLabelTown } from '@mygame/catalog'
import type { Player } from '@mygame/contracts'
import type { TownOverview } from '@mygame/contracts/town'
import { Link } from '@tanstack/react-router'
import type { ReactElement, ReactNode, RefObject } from 'react'
import { focusTargetClass } from '../design-system/focusTargetClass'
import { BackIcon } from '../design-system/icons/BackIcon'
import type { ResendVerification } from '../verification/useResendVerification'
import { VerificationBanner } from '../verification/VerificationBanner'
import { FiefSwitcher } from './FiefSwitcher'
import { RetainedWordsRing } from './RetainedWordsRing'
import type { FiefEntries } from './useFiefList'

export interface AppShellProps {
  readonly player: Player
  readonly fiefId: string | undefined
  readonly fiefs: FiefEntries | undefined
  readonly verification: ResendVerification
  readonly town: TownOverview | undefined
  readonly isTownHome: boolean
  readonly headerRef: RefObject<HTMLElement | null>
  readonly townStatus: ReactNode
  readonly children: ReactNode
}

function TownTitle({ town }: { readonly town: TownOverview }): ReactElement {
  return (
    <h1 className="m-0 font-sans text-meta text-ink-muted wrap-anywhere">
      {town.name} <span aria-hidden="true">·</span>{' '}
      {town.label === 'city' ? townLabelCity() : townLabelTown()}
    </h1>
  )
}

function BackLink(): ReactElement {
  return (
    <Link
      to="/"
      className={`inline-flex min-h-control items-center gap-1 font-sans text-meta text-ink-muted no-underline ${focusTargetClass}`}
    >
      <BackIcon />
      {shellNavigationTown()}
    </Link>
  )
}

function HeaderStart({
  town,
  isTownHome,
}: Pick<AppShellProps, 'town' | 'isTownHome'>): ReactElement | null {
  if (!isTownHome) {
    return <BackLink />
  }
  return town === undefined ? null : <TownTitle town={town} />
}

export function AppShell({
  player,
  fiefId,
  fiefs,
  verification,
  town,
  isTownHome,
  headerRef,
  townStatus,
  children,
}: AppShellProps): ReactElement {
  const retainedWords = town?.learning.retainedWords ?? null
  return (
    <div className="flex min-h-screen flex-col bg-surface text-ink">
      <header
        ref={headerRef}
        tabIndex={-1}
        className="flex flex-wrap items-center justify-between gap-x-4 px-5 py-2 focus-visible:outline-3 focus-visible:-outline-offset-3 focus-visible:outline-focus md:flex-nowrap md:px-8"
      >
        <div className="flex min-h-control min-w-0 flex-1 items-center md:flex-initial">
          <HeaderStart town={town} isTownHome={isTownHome} />
        </div>
        {retainedWords === null ? null : (
          <div className="flex shrink-0 md:order-last">
            <RetainedWordsRing {...retainedWords} />
          </div>
        )}
        {fiefId === undefined || fiefs === undefined ? null : <FiefSwitcher fiefs={fiefs} />}
      </header>
      {townStatus}
      <main className="grow px-5 pt-2 pb-6 font-sans text-body text-ink-muted md:px-8">
        {children}
      </main>
      {player.emailVerified ? null : <VerificationBanner {...verification} />}
    </div>
  )
}
