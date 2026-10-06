import { type ResourceKind, ResourceKindSchema } from '@mygame/contracts'
import type { ReactElement } from 'react'
import { copy } from '../copy'
import { ResourceBar } from '../design-system/ResourceBar'
import type { SeasonMarkProps } from '../design-system/SeasonMark'
import { SlotsStrip } from '../design-system/SlotsStrip'
import type { LiveFief } from './liveFief'
import { slotsStripCellsOf } from './slotsStripCellsOf'

const { names } = copy

function seasonMarkOf(
  season: LiveFief['overview']['season'],
  resource: ResourceKind,
): SeasonMarkProps | undefined {
  if (season === null || season.multiplierPercent[resource] === 100) {
    return undefined
  }
  return {
    season: season.kind,
    words: copy.fief.seasonMark(season.kind, resource, season.multiplierPercent[resource]),
  }
}

export function FiefStatus({ fief }: { readonly fief: LiveFief }): ReactElement {
  const { overview, amounts } = fief
  const resources = ResourceKindSchema.options.map((kind) => ({
    kind,
    label: names.resources[kind],
    amount: amounts[kind],
    ratePerHour: overview.resources[kind].ratePerHour,
    capacity: overview.resources[kind].capacity,
    mark: seasonMarkOf(overview.season, kind),
  }))
  return (
    <div className="flex flex-col gap-3 border-b border-line bg-surface pb-3 md:sticky md:top-0 md:z-10 md:pt-3">
      <ResourceBar
        resources={resources}
        peasants={{
          label: names.peasants,
          supplied: overview.peasants.projectedSupplied,
          occupied: overview.peasants.projectedOccupied,
          free: overview.peasants.projectedFree,
        }}
        labels={{ full: copy.fief.full, free: copy.fief.free, occupied: copy.fief.occupied }}
      />
      <SlotsStrip
        label={copy.status.label}
        link={{ to: '/feudo/$fiefId', params: { fiefId: overview.id } }}
        cells={slotsStripCellsOf(fief)}
        finishedLabel={copy.fief.finished}
      />
    </div>
  )
}
