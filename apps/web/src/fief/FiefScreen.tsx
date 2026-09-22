import { type BuildingKind, BuildingKindSchema, ResourceKindSchema } from '@mygame/contracts'
import type { ReactElement } from 'react'
import { copy } from '../copy'
import { BuildingCard } from '../design-system/BuildingCard'
import { BuildSlot, type BuildSlotState } from '../design-system/BuildSlot'
import { capitalize } from '../design-system/capitalize'
import { FormAlert } from '../design-system/FormAlert'
import { ResourceBar } from '../design-system/ResourceBar'
import { buildingCardOf } from './buildingCardOf'
import type { LiveFief } from './liveFief'
import type { Upgrade } from './useUpgrade'

export interface FiefScreenProps {
  readonly fief: LiveFief
  readonly slotTotalSeconds: number
  readonly upgrade: Upgrade
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

function BuildingItem({
  building,
  fief,
  upgrade,
}: {
  readonly building: BuildingKind
  readonly fief: LiveFief
  readonly upgrade: Upgrade
}): ReactElement {
  const refusal = upgrade.refused?.building === building ? upgrade.refused.refusal : undefined
  return (
    <li aria-label={names.buildings[building]} className="flex flex-col gap-2">
      <BuildingCard
        {...buildingCardOf(building, fief)}
        isWaiting={upgrade.waitingFor !== undefined}
        onUpgrade={() => upgrade.start(building)}
      />
      {refusal !== undefined && <FormAlert message={copy.refusals[refusal]} />}
    </li>
  )
}

export function FiefScreen({ fief, slotTotalSeconds, upgrade }: FiefScreenProps): ReactElement {
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
              <BuildingItem key={building} building={building} fief={fief} upgrade={upgrade} />
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}
