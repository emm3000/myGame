import { type HireKind, HireKindSchema, type SendJob } from '@mygame/contracts'
import type { ChromeCatalog, PlayerCopy } from '../copy/PlayerCopy'
import type { Label } from '../design-system/Label'
import type { LiveTown } from '../town/liveTown'
import { wholeCountFrom } from './wholeCountFrom'

export type TeamEntries = Readonly<Record<HireKind, string>>

export interface TeamField {
  readonly hire: HireKind
  readonly label: Label
  readonly hint: Label
}

type Team = SendJob['team']

export type AdmittedTeam =
  | { readonly kind: 'blocked'; readonly reason: Label }
  | { readonly kind: 'ready'; readonly team: Team }

export interface TeamForm {
  readonly fields: ReadonlyArray<TeamField>
  readonly admitted: AdmittedTeam
}

const fieldLabels: Readonly<Record<HireKind, (catalog: ChromeCatalog) => string>> = {
  worker: (catalog) => catalog.mapJobWorkers(),
  truck: (catalog) => catalog.mapJobTrucks(),
}

function admittedTeamOf(entries: TeamEntries, copy: PlayerCopy): AdmittedTeam {
  const worker = wholeCountFrom(0, entries.worker)
  const truck = wholeCountFrom(0, entries.truck)
  if (worker === undefined || truck === undefined) {
    return { kind: 'blocked', reason: copy.chrome((catalog) => catalog.mapJobCountNeeded()) }
  }
  return worker + truck === 0
    ? { kind: 'blocked', reason: copy.fixedCopy((catalog) => catalog.refusalInvalidTeam()) }
    : { kind: 'ready', team: { worker, truck } }
}

export function teamFormOf(entries: TeamEntries, town: LiveTown, copy: PlayerCopy): TeamForm {
  return {
    fields: HireKindSchema.options.map((hire) => ({
      hire,
      label: copy.chrome(fieldLabels[hire]),
      hint: copy.chrome((catalog) =>
        catalog.mapJobAtHome({ count: town.overview.hiring.hires[hire] }),
      ),
    })),
    admitted: admittedTeamOf(entries, copy),
  }
}
