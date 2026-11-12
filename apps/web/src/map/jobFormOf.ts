import { mapJobHours, mapJobHoursNeeded, mapJobSend, mapJobTitle } from '@mygame/catalog'
import type { HireKind, SendJob } from '@mygame/contracts'
import type { OrderActionState } from '../design-system/CardAction'
import type { LiveTown } from '../town/liveTown'
import { type AdmittedTeam, type TeamField, teamFormOf } from './teamFormOf'
import { wholeCountFrom } from './wholeCountFrom'

export type JobEntries = Readonly<Record<HireKind | 'hours', string>>

export const firstJobEntries: JobEntries = { worker: '0', truck: '0', hours: '1' }

export interface JobFormContent {
  readonly title: string
  readonly teamFields: ReadonlyArray<TeamField>
  readonly hoursLabel: string
  readonly actionLabel: string
  readonly state: OrderActionState
  readonly job: SendJob | undefined
}

type AdmittedJob =
  | { readonly kind: 'blocked'; readonly reason: string }
  | { readonly kind: 'ready'; readonly job: SendJob }

function admittedJobOf(site: SendJob['site'], hoursEntry: string, team: AdmittedTeam): AdmittedJob {
  if (team.kind === 'blocked') {
    return team
  }
  const hours = wholeCountFrom(1, hoursEntry)
  return hours === undefined
    ? { kind: 'blocked', reason: mapJobHoursNeeded() }
    : { kind: 'ready', job: { site, team: team.team, hours } }
}

export function jobFormOf(
  site: SendJob['site'],
  entries: JobEntries,
  town: LiveTown,
): JobFormContent {
  const team = teamFormOf(entries, town)
  const admitted = admittedJobOf(site, entries.hours, team.admitted)
  return {
    title: mapJobTitle({ site: site.site }),
    teamFields: team.fields,
    hoursLabel: mapJobHours(),
    actionLabel: mapJobSend(),
    state:
      admitted.kind === 'ready'
        ? { kind: 'affordable' }
        : { kind: 'blocked', reason: admitted.reason },
    job: admitted.kind === 'ready' ? admitted.job : undefined,
  }
}
