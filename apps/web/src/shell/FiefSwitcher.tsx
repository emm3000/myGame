import { Link, type LinkProps, useMatchRoute } from '@tanstack/react-router'
import type { ReactElement } from 'react'
import { copy } from '../copy'
import type { FiefEntries } from './useFiefList'

export interface FiefSwitcherProps {
  readonly fiefs: FiefEntries
}

type ScreenPath = NonNullable<LinkProps['to']>

const fiefScreen: ScreenPath = '/feudo/$fiefId'
const mapScreen: ScreenPath = '/feudo/$fiefId/mapa'
const chronicleScreen: ScreenPath = '/feudo/$fiefId/cronica'

function useKeptScreen(): ScreenPath {
  const matchRoute = useMatchRoute()
  if (matchRoute({ to: mapScreen, fuzzy: true }) !== false) {
    return mapScreen
  }
  if (matchRoute({ to: chronicleScreen }) !== false) {
    return chronicleScreen
  }
  return fiefScreen
}

const entryClass =
  'flex min-h-control min-w-0 grow flex-col justify-center rounded-md px-3 py-1 no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-line-strong md:flex-row md:items-center md:justify-start md:gap-2'
const currentEntryClass = 'border-2 border-l-4 border-river bg-surface-raised'
const otherEntryClass = 'border border-line bg-surface'
const nameClass = 'font-utility text-button wrap-anywhere'
const currentNameClass = 'font-bold text-ink'
const otherNameClass = 'text-umber underline underline-offset-2'

export function FiefSwitcher({ fiefs }: FiefSwitcherProps): ReactElement {
  const keptScreen = useKeptScreen()
  const { label, separator } = copy.shell.fiefSwitcher
  return (
    <nav
      aria-label={label}
      className="flex min-w-0 basis-full flex-col gap-1 md:mr-auto md:basis-auto md:flex-row md:items-center md:gap-3"
    >
      <span className="font-utility text-label uppercase text-ink-muted">{label}</span>
      <ul className="m-0 grid list-none grid-cols-2 gap-2 p-0 md:flex">
        {fiefs.map((fief) => (
          <li key={fief.id} className="flex min-w-0">
            <Link
              to={keptScreen}
              params={{ fiefId: fief.id }}
              className={entryClass}
              activeProps={{ className: currentEntryClass }}
              inactiveProps={{ className: otherEntryClass }}
            >
              {({ isActive }) => (
                <>
                  <span className={`${nameClass} ${isActive ? currentNameClass : otherNameClass}`}>
                    {fief.name}
                    <span className="sr-only">{separator}</span>
                  </span>{' '}
                  <span aria-hidden="true" className="hidden text-ink-muted md:inline">
                    ·
                  </span>
                  <span className="whitespace-nowrap font-utility text-caption font-semibold text-ink-muted tabular-nums">
                    {copy.names.address(fief.coordinates)}
                  </span>
                </>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
