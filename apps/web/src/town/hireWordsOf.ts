import type { HireKind } from '@mygame/contracts'
import type { ChromeCatalog } from '../copy/PlayerCopy'

interface Counted {
  readonly count: number
}

export interface HireWords {
  readonly name: (catalog: ChromeCatalog) => string
  readonly team: (catalog: ChromeCatalog, counted: Counted) => string
  readonly fieldLabel: (catalog: ChromeCatalog) => string
  readonly hire: (catalog: ChromeCatalog, counted: Counted) => string
  readonly hireAny: (catalog: ChromeCatalog) => string
  readonly stopOf: (catalog: ChromeCatalog) => string
}

const hireWords: Readonly<Record<HireKind, HireWords>> = {
  worker: {
    name: (catalog) => catalog.namesHiresWorker(),
    team: (catalog, counted) => catalog.townOfficeTeamWorker(counted),
    fieldLabel: (catalog) => catalog.townOfficeCountWorker(),
    hire: (catalog, counted) => catalog.townOfficeHireWorker(counted),
    hireAny: (catalog) => catalog.townOfficeHireAnyWorker(),
    stopOf: (catalog) => catalog.townOfficeStopOfWorker(),
  },
  truck: {
    name: (catalog) => catalog.namesHiresTruck(),
    team: (catalog, counted) => catalog.townOfficeTeamTruck(counted),
    fieldLabel: (catalog) => catalog.townOfficeCountTruck(),
    hire: (catalog, counted) => catalog.townOfficeHireTruck(counted),
    hireAny: (catalog) => catalog.townOfficeHireAnyTruck(),
    stopOf: (catalog) => catalog.townOfficeStopOfTruck(),
  },
}

export const hireWordsOf = (hire: HireKind): HireWords => hireWords[hire]
