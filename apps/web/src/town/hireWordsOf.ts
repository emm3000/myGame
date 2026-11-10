import {
  namesHiresTruck,
  namesHiresWorker,
  townOfficeCountTruck,
  townOfficeCountWorker,
  townOfficeHireAnyTruck,
  townOfficeHireAnyWorker,
  townOfficeHireTruck,
  townOfficeHireWorker,
  townOfficeStopOfTruck,
  townOfficeStopOfWorker,
  townOfficeTeamTruck,
  townOfficeTeamWorker,
} from '@mygame/catalog'
import type { HireKind } from '@mygame/contracts'

export interface HireWords {
  readonly name: () => string
  readonly team: (counted: { readonly count: number }) => string
  readonly fieldLabel: () => string
  readonly hire: (counted: { readonly count: number }) => string
  readonly hireAny: () => string
  readonly stopOf: () => string
}

const hireWords: Readonly<Record<HireKind, HireWords>> = {
  worker: {
    name: namesHiresWorker,
    team: townOfficeTeamWorker,
    fieldLabel: townOfficeCountWorker,
    hire: townOfficeHireWorker,
    hireAny: townOfficeHireAnyWorker,
    stopOf: townOfficeStopOfWorker,
  },
  truck: {
    name: namesHiresTruck,
    team: townOfficeTeamTruck,
    fieldLabel: townOfficeCountTruck,
    hire: townOfficeHireTruck,
    hireAny: townOfficeHireAnyTruck,
    stopOf: townOfficeStopOfTruck,
  },
}

export const hireWordsOf = (hire: HireKind): HireWords => hireWords[hire]
