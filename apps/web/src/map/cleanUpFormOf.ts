import { mapCleanUpTitle, mapJobSend } from '@mygame/catalog'
import type { SendCleanUp } from '@mygame/contracts'
import type { OrderActionState } from '../design-system/CardAction'
import type { LiveTown } from '../town/liveTown'
import { type TeamEntries, type TeamField, teamFormOf } from './teamFormOf'

export const firstCleanUpEntries: TeamEntries = { worker: '0', truck: '0' }

export interface CleanUpFormContent {
  readonly title: string
  readonly teamFields: ReadonlyArray<TeamField>
  readonly actionLabel: string
  readonly state: OrderActionState
  readonly cleanUp: SendCleanUp | undefined
}

export function cleanUpFormOf(
  site: SendCleanUp['site'],
  entries: TeamEntries,
  town: LiveTown,
): CleanUpFormContent {
  const { fields, admitted } = teamFormOf(entries, town)
  return {
    title: mapCleanUpTitle({ site: site.site }),
    teamFields: fields,
    actionLabel: mapJobSend(),
    state:
      admitted.kind === 'ready'
        ? { kind: 'affordable' }
        : { kind: 'invalidEntry', reason: admitted.reason },
    cleanUp: admitted.kind === 'ready' ? { site, team: admitted.team } : undefined,
  }
}
