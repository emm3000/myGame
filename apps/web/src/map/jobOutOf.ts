import {
  mapCleanUpOutTitle,
  mapJobOutCallBack,
  mapJobOutCalledBack,
  mapJobOutOutbound,
  mapJobOutPay,
  mapJobOutReturning,
  mapJobOutSite,
  mapJobOutTeam,
  mapJobOutTitle,
  mapJobOutWorking,
  mapWasteAmount,
} from '@mygame/catalog'
import type { CallJobBack } from '@mygame/contracts'
import type { SlotCountdown } from '../design-system/CountdownLine'
import { amountsLineOf } from '../resources/amountsLineOf'
import { formatFinish } from '../time/formatFinish'
import type { LiveJob, LiveTown } from '../town/liveTown'

export interface JobOutContent {
  readonly title: string
  readonly siteLine: string
  readonly teamLine: string
  readonly wasteLine: string | undefined
  readonly countdown: SlotCountdown
  readonly pay: string | undefined
  readonly callBack: { readonly label: string; readonly target: CallJobBack } | undefined
}

const phaseWords: Readonly<Record<LiveJob['phase'], () => string>> = {
  outbound: mapJobOutOutbound,
  working: mapJobOutWorking,
  returning: mapJobOutReturning,
}

export function jobOutOf(town: LiveTown): JobOutContent | undefined {
  const answered = town.overview.job
  const live = town.job
  if (answered === null || live === null) {
    return undefined
  }
  const pay = amountsLineOf(answered.pay)
  return {
    title: answered.kind === 'cleanUp' ? mapCleanUpOutTitle() : mapJobOutTitle(),
    siteLine: mapJobOutSite(answered.site),
    teamLine: mapJobOutTeam({ workers: answered.team.worker, trucks: answered.team.truck }),
    wasteLine: answered.kind === 'cleanUp' ? mapWasteAmount({ waste: answered.waste }) : undefined,
    countdown: {
      words: answered.calledBackAt === null ? phaseWords[live.phase]() : mapJobOutCalledBack(),
      time: formatFinish(live.remainingSeconds, town.at),
    },
    pay: pay === undefined ? undefined : mapJobOutPay({ amounts: pay }),
    callBack:
      live.phase === 'returning'
        ? undefined
        : { label: mapJobOutCallBack(), target: { sentAt: answered.sentAt } },
  }
}
