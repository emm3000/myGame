import {
  shellFiefSwitcherFullStore,
  shellFiefSwitcherLabel,
  shellFiefSwitcherSeparator,
  statusIdleBuild,
  statusIdleMarch,
  statusIdleRecruit,
  statusIdleStudy,
} from '@mygame/catalog'
import { Link, type LinkProps, useMatchRoute } from '@tanstack/react-router'
import type { ReactElement } from 'react'
import { Chip } from '../design-system/Chip'
import { MarchIcon } from '../design-system/icons/MarchIcon'
import { SlotIcon } from '../design-system/icons/SlotIcon'
import { resourceAccent } from '../design-system/resourceAccent'
import { addressOf } from '../map/addressOf'
import { resourceNameOf } from '../resources/resourceNameOf'
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

type FiefEntry = FiefEntries[number]
type FreeSlot = FiefEntry['freeSlots'][number]

const freeSlotLines: Readonly<Record<FreeSlot, string>> = {
  build: statusIdleBuild(),
  study: statusIdleStudy(),
  recruit: statusIdleRecruit(),
  march: statusIdleMarch(),
}

function FreeSlotIcon({ slot }: { readonly slot: FreeSlot }): ReactElement {
  return slot === 'march' ? <MarchIcon /> : <SlotIcon />
}

function FiefBadges({ fief }: { readonly fief: FiefEntry }): ReactElement | null {
  if (fief.freeSlots.length === 0 && fief.fullStores.length === 0) {
    return null
  }
  const separator = shellFiefSwitcherSeparator()
  return (
    <span className="flex flex-wrap gap-1 pt-1 md:pt-0">
      {fief.freeSlots.map((slot) => (
        <Chip
          key={slot}
          icon={<FreeSlotIcon slot={slot} />}
          text={freeSlotLines[slot]}
          separator={separator}
        />
      ))}
      {fief.fullStores.map((resource) => {
        const Icon = resourceAccent[resource]
        return (
          <Chip
            key={resource}
            icon={
              <span className="flex text-ink">
                <Icon />
              </span>
            }
            text={shellFiefSwitcherFullStore({ resource: resourceNameOf(resource) })}
            separator={separator}
          />
        )
      })}
    </span>
  )
}

const entryClass =
  'flex min-h-control min-w-0 grow flex-col justify-center rounded-md px-3 py-1 no-underline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus md:flex-row md:items-center md:justify-start md:gap-2'
const currentEntryClass = 'border-2 border-action bg-surface-raised'
const otherEntryClass = 'border border-line bg-surface'
const nameClass = 'font-sans text-button wrap-anywhere'
const currentNameClass = 'font-bold text-ink'
const otherNameClass = 'text-action underline underline-offset-2'

export function FiefSwitcher({ fiefs }: FiefSwitcherProps): ReactElement {
  const keptScreen = useKeptScreen()
  const label = shellFiefSwitcherLabel()
  const separator = shellFiefSwitcherSeparator()
  return (
    <nav
      aria-label={label}
      className="flex min-w-0 basis-full flex-col gap-1 md:mr-auto md:basis-auto md:flex-row md:items-center md:gap-3"
    >
      <span className="font-sans text-label text-ink-muted">{label}</span>
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
                  <span className="whitespace-nowrap font-sans text-caption font-semibold text-ink-muted tabular-nums">
                    {addressOf(fief.coordinates)}
                  </span>
                  {!isActive && <FiefBadges fief={fief} />}
                </>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
