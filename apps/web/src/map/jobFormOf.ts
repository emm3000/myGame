import type { HireKind, SendJob } from '@mygame/contracts'
import type { PlayerCopy } from '../copy/PlayerCopy'
import type { OrderActionState } from '../design-system/CardAction'
import type { Label } from '../design-system/Label'
import type { LiveTown } from '../town/liveTown'
import { type AdmittedTeam, type TeamField, teamFormOf } from './teamFormOf'
import { wholeCountFrom } from './wholeCountFrom'

export type JobEntries = Readonly<Record<HireKind | 'hours', string>>

export const firstJobEntries: JobEntries = { worker: '0', truck: '0', hours: '1' }

export interface JobFormContent {
  readonly title: Label
  readonly teamFields: ReadonlyArray<TeamField>
  readonly hoursLabel: Label
  readonly actionLabel: Label
  readonly state: OrderActionState
  readonly job: SendJob | undefined
}

type AdmittedJob =
  | { readonly kind: 'blocked'; readonly reason: Label }
  | { readonly kind: 'ready'; readonly job: SendJob }

function admittedJobOf(
  site: SendJob['site'],
  hoursEntry: string,
  team: AdmittedTeam,
  copy: PlayerCopy,
): AdmittedJob {
  if (team.kind === 'blocked') {
    return team
  }
  const hours = wholeCountFrom(1, hoursEntry)
  return hours === undefined
    ? { kind: 'blocked', reason: copy.chrome((catalog) => catalog.mapJobHoursNeeded()) }
    : { kind: 'ready', job: { site, team: team.team, hours } }
}

export function jobFormOf(
  site: SendJob['site'],
  entries: JobEntries,
  town: LiveTown,
  copy: PlayerCopy,
): JobFormContent {
  const team = teamFormOf(entries, town, copy)
  const admitted = admittedJobOf(site, entries.hours, team.admitted, copy)
  return {
    title: copy.chrome((catalog) => catalog.mapJobTitle({ site: site.site })),
    teamFields: team.fields,
    hoursLabel: copy.chrome((catalog) => catalog.mapJobHours()),
    actionLabel: copy.chrome((catalog) => catalog.mapJobSend()),
    state:
      admitted.kind === 'ready'
        ? { kind: 'affordable' }
        : { kind: 'invalidEntry', reason: admitted.reason },
    job: admitted.kind === 'ready' ? admitted.job : undefined,
  }
}
