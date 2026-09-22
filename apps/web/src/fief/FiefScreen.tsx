import { type BuildingKind, BuildingKindSchema, ResourceKindSchema } from '@mygame/contracts'
import type { ReactElement } from 'react'
import { copy } from '../copy'
import { BuildSlot, type BuildSlotState } from '../design-system/BuildSlot'
import { capitalize } from '../design-system/capitalize'
import { Panel } from '../design-system/Panel'
import { ResourceBar } from '../design-system/ResourceBar'
import type { LiveFief } from './liveFief'

export interface FiefScreenProps {
  readonly fief: LiveFief
  readonly slotTotalSeconds: number
}

const { names } = copy

function addressOf({ coordinates }: LiveFief['overview']): string {
  const kingdom = names.kingdoms[coordinates.kingdom] ?? String(coordinates.kingdom)
  return `${kingdom} ${coordinates.province}:${coordinates.plot}`
}

function slotStateOf(fief: LiveFief, slotTotalSeconds: number): BuildSlotState {
  const { slot } = fief.overview
  if (slot.kind === 'idle') {
    return { kind: 'idle', title: names.slot, invitation: names.idleSlot }
  }
  const building = {
    buildingName: capitalize(names.buildings[slot.building]),
    levelLabel: names.level(slot.targetLevel),
  }
  if (fief.slotRemainingSeconds <= 0) {
    return { kind: 'justFinished', title: names.slot, message: copy.fief.justFinished, ...building }
  }
  return {
    kind: 'busy',
    title: names.busySlot,
    remainingSeconds: fief.slotRemainingSeconds,
    totalSeconds: slotTotalSeconds,
    finishedLabel: copy.fief.finished,
    ...building,
  }
}

function BuildingLevel({
  building,
  level,
}: {
  readonly building: BuildingKind
  readonly level: number
}): ReactElement {
  return (
    <li>
      <Panel element="article" toneClass="border-line bg-surface-raised" spacingClass="gap-2 p-4">
        <h4 className="m-0 font-display text-title text-ink">
          {capitalize(names.buildings[building])}
        </h4>
        <span className="self-start rounded-pill bg-umber px-2 font-utility text-label text-on-umber tabular-nums">
          {names.level(level)}
        </span>
      </Panel>
    </li>
  )
}

export function FiefScreen({ fief, slotTotalSeconds }: FiefScreenProps): ReactElement {
  const { overview, amounts } = fief
  const resources = ResourceKindSchema.options.map((kind) => ({
    kind,
    label: names.resources[kind],
    amount: amounts[kind],
    ratePerHour: overview.resources[kind].ratePerHour,
    capacity: overview.resources[kind].capacity,
  }))
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <span className="font-utility text-label text-ink-muted tabular-nums">
          {addressOf(overview)}
        </span>
        <h2 className="m-0 font-display text-display-xl text-ink">{overview.name}</h2>
      </header>
      <ResourceBar
        resources={resources}
        peasants={{ label: names.peasants, ...overview.peasants }}
        labels={{ full: copy.fief.full, free: copy.fief.free, occupied: copy.fief.occupied }}
      />
      <div className="grid items-start gap-6 lg:grid-cols-3">
        <BuildSlot state={slotStateOf(fief, slotTotalSeconds)} />
        <section className="flex flex-col gap-3 lg:col-span-2">
          <h3 className="m-0 font-body text-heading text-ink">{copy.fief.buildings}</h3>
          <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2 xl:grid-cols-3">
            {BuildingKindSchema.options.map((building) => (
              <BuildingLevel
                key={building}
                building={building}
                level={overview.buildings[building]}
              />
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}
