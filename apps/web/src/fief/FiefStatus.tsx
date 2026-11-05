import {
  fiefFillsAt,
  fiefFree,
  fiefFull,
  fiefOccupied,
  namesPeasants,
  statusLabel,
  statusNoticesDenied,
  statusNoticesLabel,
  statusNoticesOff,
  statusNoticesOn,
  statusNoticesPromise,
} from '@mygame/catalog'
import { type ResourceKind, ResourceKindSchema } from '@mygame/contracts'
import type { ReactElement } from 'react'
import { Hint, type HintProps } from '../design-system/Hint'
import type { NoticeToggleProps } from '../design-system/NoticeToggle'
import { ResourceBar } from '../design-system/ResourceBar'
import type { SeasonMarkProps } from '../design-system/SeasonMark'
import { SlotsStrip } from '../design-system/SlotsStrip'
import type { FinishNoticesHandle } from '../notices/useFinishNotices'
import { resourceNameOf } from '../resources/resourceNameOf'
import { neutralPercent } from '../seasons/neutralPercent'
import { seasonMarkLineOf } from '../seasons/seasonMarkLineOf'
import { formatClock } from '../time/formatClock'
import type { LiveFief } from './liveFief'
import { slotsStripCellsOf } from './slotsStripCellsOf'

const fillingWindowMs = 8 * 3600 * 1000

function fillingLineOf(fief: LiveFief, resource: ResourceKind): string | undefined {
  const { fullAt } = fief.overview.resources[resource]
  if (fullAt === null) {
    return undefined
  }
  const fillsAt = new Date(fullAt)
  const isWithinWindow = fillsAt.getTime() - Date.parse(fief.overview.readAt) <= fillingWindowMs
  return isWithinWindow ? fiefFillsAt({ clock: formatClock(fillsAt, fief.at) }) : undefined
}

function seasonMarkOf(
  season: LiveFief['overview']['season'],
  resource: ResourceKind,
): SeasonMarkProps | undefined {
  if (season === null || season.multiplierPercent[resource] === neutralPercent) {
    return undefined
  }
  return {
    season: season.kind,
    words: seasonMarkLineOf(season.kind, resource, season.multiplierPercent[resource]),
  }
}

function noticeTogglePropsOf({ state, toggle }: FinishNoticesHandle): NoticeToggleProps {
  const isOn = state === 'on'
  return {
    label: statusNoticesLabel(),
    stateWords: isOn ? statusNoticesOn() : statusNoticesOff(),
    promise: statusNoticesPromise(),
    isOn,
    deniedLine: state === 'denied' ? statusNoticesDenied() : undefined,
    onToggle: toggle,
  }
}

export function FiefStatus({
  fief,
  hint,
  notices,
  blockRef,
}: {
  readonly fief: LiveFief
  readonly hint: HintProps | undefined
  readonly notices: FinishNoticesHandle
  readonly blockRef: (block: HTMLElement | null) => void
}): ReactElement {
  const { overview, amounts } = fief
  const resources = ResourceKindSchema.options.map((kind) => ({
    kind,
    label: resourceNameOf(kind),
    amount: amounts[kind],
    ratePerHour: overview.resources[kind].ratePerHour,
    capacity: overview.resources[kind].capacity,
    fillingLine: fillingLineOf(fief, kind),
    mark: seasonMarkOf(overview.season, kind),
  }))
  return (
    <>
      <div
        ref={blockRef}
        className="flex flex-col gap-3 border-b border-line bg-surface pb-3 md:sticky md:top-0 md:z-10 md:pt-3"
      >
        <ResourceBar
          resources={resources}
          peasants={{
            label: namesPeasants(),
            supplied: overview.peasants.projectedSupplied,
            occupied: overview.peasants.projectedOccupied,
            free: overview.peasants.projectedFree,
          }}
          labels={{
            full: fiefFull(),
            free: (supplied) => fiefFree({ supplied }),
            occupied: (occupied) => fiefOccupied({ occupied }),
          }}
        />
        <SlotsStrip
          label={statusLabel()}
          link={{ to: '/feudo/$fiefId', params: { fiefId: overview.id } }}
          cells={slotsStripCellsOf(fief)}
          notices={noticeTogglePropsOf(notices)}
        />
      </div>
      {hint !== undefined && <Hint {...hint} />}
    </>
  )
}
