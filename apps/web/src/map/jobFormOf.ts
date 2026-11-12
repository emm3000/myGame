import {
  mapJobAtHome,
  mapJobCountNeeded,
  mapJobHours,
  mapJobHoursNeeded,
  mapJobSend,
  mapJobTitle,
  mapJobTrucks,
  mapJobWorkers,
  refusalInvalidTeam,
} from '@mygame/catalog'
import { type HireKind, HireKindSchema, type SendJob } from '@mygame/contracts'
import type { OrderActionState } from '../design-system/CardAction'
import type { LiveTown } from '../town/liveTown'

export type JobEntries = Readonly<Record<HireKind | 'hours', string>>

export const firstJobEntries: JobEntries = { worker: '0', truck: '0', hours: '1' }

export interface JobTeamField {
  readonly hire: HireKind
  readonly label: string
  readonly hint: string
}

export interface JobFormContent {
  readonly title: string
  readonly teamFields: ReadonlyArray<JobTeamField>
  readonly hoursLabel: string
  readonly actionLabel: string
  readonly state: OrderActionState
  readonly job: SendJob | undefined
}

type Team = SendJob['team']

const wholeCountPattern = /^[0-9]+$/

const wholeCountFrom = (least: number, entry: string): number | undefined => {
  if (!wholeCountPattern.test(entry)) {
    return undefined
  }
  const count = Number(entry)
  return count >= least ? count : undefined
}

const teamOf = (entries: JobEntries): Team | undefined => {
  const worker = wholeCountFrom(0, entries.worker)
  const truck = wholeCountFrom(0, entries.truck)
  return worker === undefined || truck === undefined ? undefined : { worker, truck }
}

const teamFieldLabels: Readonly<Record<HireKind, () => string>> = {
  worker: mapJobWorkers,
  truck: mapJobTrucks,
}

type AdmittedJob =
  | { readonly kind: 'blocked'; readonly reason: string }
  | { readonly kind: 'ready'; readonly job: SendJob }

const blocked = (reason: string): AdmittedJob => ({ kind: 'blocked', reason })

function admittedJobOf(site: SendJob['site'], entries: JobEntries): AdmittedJob {
  const team = teamOf(entries)
  if (team === undefined) {
    return blocked(mapJobCountNeeded())
  }
  if (team.worker + team.truck === 0) {
    return blocked(refusalInvalidTeam())
  }
  const hours = wholeCountFrom(1, entries.hours)
  if (hours === undefined) {
    return blocked(mapJobHoursNeeded())
  }
  return { kind: 'ready', job: { site, team, hours } }
}

export function jobFormOf(
  site: SendJob['site'],
  entries: JobEntries,
  town: LiveTown,
): JobFormContent {
  const admitted = admittedJobOf(site, entries)
  return {
    title: mapJobTitle({ site: site.site }),
    teamFields: HireKindSchema.options.map((hire) => ({
      hire,
      label: teamFieldLabels[hire](),
      hint: mapJobAtHome({ count: town.overview.hiring.hires[hire] }),
    })),
    hoursLabel: mapJobHours(),
    actionLabel: mapJobSend(),
    state:
      admitted.kind === 'ready'
        ? { kind: 'affordable' }
        : { kind: 'blocked', reason: admitted.reason },
    job: admitted.kind === 'ready' ? admitted.job : undefined,
  }
}
