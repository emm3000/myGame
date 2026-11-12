import {
  mapJobAtHome,
  mapJobCountNeeded,
  mapJobTrucks,
  mapJobWorkers,
  refusalInvalidTeam,
} from '@mygame/catalog'
import { type HireKind, HireKindSchema, type SendJob } from '@mygame/contracts'
import type { LiveTown } from '../town/liveTown'
import { wholeCountFrom } from './wholeCountFrom'

export type TeamEntries = Readonly<Record<HireKind, string>>

export interface TeamField {
  readonly hire: HireKind
  readonly label: string
  readonly hint: string
}

type Team = SendJob['team']

export type AdmittedTeam =
  | { readonly kind: 'blocked'; readonly reason: string }
  | { readonly kind: 'ready'; readonly team: Team }

export interface TeamForm {
  readonly fields: ReadonlyArray<TeamField>
  readonly admitted: AdmittedTeam
}

const fieldLabels: Readonly<Record<HireKind, () => string>> = {
  worker: mapJobWorkers,
  truck: mapJobTrucks,
}

function admittedTeamOf(entries: TeamEntries): AdmittedTeam {
  const worker = wholeCountFrom(0, entries.worker)
  const truck = wholeCountFrom(0, entries.truck)
  if (worker === undefined || truck === undefined) {
    return { kind: 'blocked', reason: mapJobCountNeeded() }
  }
  return worker + truck === 0
    ? { kind: 'blocked', reason: refusalInvalidTeam() }
    : { kind: 'ready', team: { worker, truck } }
}

export function teamFormOf(entries: TeamEntries, town: LiveTown): TeamForm {
  return {
    fields: HireKindSchema.options.map((hire) => ({
      hire,
      label: fieldLabels[hire](),
      hint: mapJobAtHome({ count: town.overview.hiring.hires[hire] }),
    })),
    admitted: admittedTeamOf(entries),
  }
}
