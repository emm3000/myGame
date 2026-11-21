import type { CallJobBack } from '@mygame/contracts'
import type { ChromeCatalog, PlayerCopy } from '../copy/PlayerCopy'
import type { SlotCountdown } from '../design-system/CountdownLine'
import type { Label } from '../design-system/Label'
import { formatFinish } from '../time/formatFinish'
import type { LiveJob, LiveTown } from '../town/liveTown'
import { jobPayLineOf } from './jobPayLineOf'

export interface JobOutContent {
  readonly title: Label
  readonly siteLine: Label
  readonly teamLine: Label
  readonly wasteLine: Label | undefined
  readonly countdown: SlotCountdown
  readonly pay: Label | undefined
  readonly callBack: { readonly label: Label; readonly target: CallJobBack } | undefined
}

const phaseWords: Readonly<Record<LiveJob['phase'], (catalog: ChromeCatalog) => string>> = {
  outbound: (catalog) => catalog.mapJobOutOutbound(),
  working: (catalog) => catalog.mapJobOutWorking(),
  returning: (catalog) => catalog.mapJobOutReturning(),
}

const countdownOf = (
  town: LiveTown,
  live: LiveJob,
  isCalledBack: boolean,
  copy: PlayerCopy,
): SlotCountdown => ({
  words: copy.chrome(
    isCalledBack ? (catalog) => catalog.mapJobOutCalledBack() : phaseWords[live.phase],
  ),
  time: copy.chrome((catalog) => formatFinish(catalog, live.remainingSeconds, town.at)).text,
})

export function jobOutOf(town: LiveTown, copy: PlayerCopy): JobOutContent | undefined {
  const answered = town.overview.job
  const live = town.job
  if (answered === null || live === null) {
    return undefined
  }
  return {
    title: copy.chrome((catalog) =>
      answered.kind === 'cleanUp' ? catalog.mapCleanUpOutTitle() : catalog.mapJobOutTitle(),
    ),
    siteLine: copy.chrome((catalog) => catalog.mapJobOutSite(answered.site)),
    teamLine: copy.chrome((catalog) =>
      catalog.mapJobOutTeam({ workers: answered.team.worker, trucks: answered.team.truck }),
    ),
    wasteLine:
      answered.kind === 'cleanUp'
        ? copy.chrome((catalog) => catalog.mapWasteAmount({ waste: answered.waste }))
        : undefined,
    countdown: countdownOf(town, live, answered.calledBackAt !== null, copy),
    pay: jobPayLineOf(copy, answered.pay, (catalog, amounts) => catalog.mapJobOutPay({ amounts })),
    callBack:
      live.phase === 'returning'
        ? undefined
        : {
            label: copy.chrome((catalog) => catalog.mapJobOutCallBack()),
            target: { sentAt: answered.sentAt },
          },
  }
}
