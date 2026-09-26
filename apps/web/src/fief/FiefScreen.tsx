import { type BuildingKind, BuildingKindSchema, ResourceKindSchema } from '@mygame/contracts'
import type { ReactElement } from 'react'
import { copy } from '../copy'
import { BuildingCard } from '../design-system/BuildingCard'
import { BuildSlot, type BuildSlotState } from '../design-system/BuildSlot'
import type { CancelAction } from '../design-system/CancelAction'
import { capitalize } from '../design-system/capitalize'
import { FormAlert } from '../design-system/FormAlert'
import { ResourceBar } from '../design-system/ResourceBar'
import { WaitingUpgrades } from '../design-system/WaitingUpgrades'
import { buildingCardOf } from './buildingCardOf'
import type { LiveFief } from './liveFief'
import type { Cancel } from './useCancel'
import type { Upgrade } from './useUpgrade'

export interface FiefScreenProps {
  readonly fief: LiveFief
  readonly upgrade: Upgrade
  readonly cancel: Cancel
}

const { names } = copy

function addressOf({ coordinates }: LiveFief['overview']): string {
  const kingdom = names.kingdoms[coordinates.kingdom] ?? String(coordinates.kingdom)
  return `${kingdom} ${coordinates.province}:${coordinates.plot}`
}

function cancelActionOf(cancel: Cancel, position: number): CancelAction {
  return {
    label: copy.fief.cancel,
    isWaiting: cancel.isWaiting,
    onCancel: () => cancel.start(position),
  }
}

function slotStateOf(fief: LiveFief, cancel: Cancel): BuildSlotState {
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
    totalSeconds: fief.slotTotalSeconds,
    finishedLabel: copy.fief.finished,
    cancel: cancelActionOf(cancel, 0),
    ...building,
  }
}

function WaitingUpgradesOf({
  fief,
  cancel,
}: {
  readonly fief: LiveFief
  readonly cancel: Cancel
}): ReactElement | null {
  if (fief.waitingUpgrades.length === 0) {
    return null
  }
  const upgrades = fief.waitingUpgrades.map(
    ({ building, targetLevel, remainingSeconds }, index) => ({
      buildingName: capitalize(names.buildings[building]),
      levelLabel: names.level(targetLevel),
      remainingSeconds,
      cancel: cancelActionOf(cancel, index + 1),
    }),
  )
  return (
    <WaitingUpgrades
      title={names.buildQueue}
      upgrades={upgrades}
      finishedLabel={copy.fief.finished}
    />
  )
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
        titleElement="h4"
        isWaiting={upgrade.isWaiting}
        onUpgrade={() => upgrade.start(building)}
      />
      {refusal !== undefined && <FormAlert message={copy.refusals[refusal]} />}
    </li>
  )
}

export function FiefScreen({ fief, upgrade, cancel }: FiefScreenProps): ReactElement {
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
        peasants={{
          label: names.peasants,
          supplied: overview.peasants.supplied,
          occupied: overview.peasants.occupied,
          free: overview.peasants.free,
        }}
        labels={{ full: copy.fief.full, free: copy.fief.free, occupied: copy.fief.occupied }}
      />
      <div className="grid items-start gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-2">
          <BuildSlot state={slotStateOf(fief, cancel)} />
          {cancel.refusal !== undefined && <FormAlert message={copy.refusals[cancel.refusal]} />}
          <WaitingUpgradesOf fief={fief} cancel={cancel} />
        </div>
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
