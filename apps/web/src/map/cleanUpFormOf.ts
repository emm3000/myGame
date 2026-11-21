import type { SendCleanUp } from '@mygame/contracts'
import type { PlayerCopy } from '../copy/PlayerCopy'
import type { OrderActionState } from '../design-system/CardAction'
import type { Label } from '../design-system/Label'
import type { LiveTown } from '../town/liveTown'
import { type TeamEntries, type TeamField, teamFormOf } from './teamFormOf'

export const firstCleanUpEntries: TeamEntries = { worker: '0', truck: '0' }

export interface CleanUpFormContent {
  readonly title: Label
  readonly teamFields: ReadonlyArray<TeamField>
  readonly actionLabel: Label
  readonly state: OrderActionState
  readonly cleanUp: SendCleanUp | undefined
}

export function cleanUpFormOf(
  site: SendCleanUp['site'],
  entries: TeamEntries,
  town: LiveTown,
  copy: PlayerCopy,
): CleanUpFormContent {
  const { fields, admitted } = teamFormOf(entries, town, copy)
  return {
    title: copy.chrome((catalog) => catalog.mapCleanUpTitle({ site: site.site })),
    teamFields: fields,
    actionLabel: copy.chrome((catalog) => catalog.mapJobSend()),
    state:
      admitted.kind === 'ready'
        ? { kind: 'affordable' }
        : { kind: 'invalidEntry', reason: admitted.reason },
    cleanUp: admitted.kind === 'ready' ? { site, team: admitted.team } : undefined,
  }
}
