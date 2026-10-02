import {
  type BuildingKind,
  BuildingKindSchema,
  type CancelUpgradeRequest,
  type ResourceKind,
  ResourceKindSchema,
} from '@mygame/contracts'
import { Link } from '@tanstack/react-router'
import { type ReactElement, useId } from 'react'
import { copy } from '../copy'
import { BuildingCard } from '../design-system/BuildingCard'
import { BuildSlot, type BuildSlotState } from '../design-system/BuildSlot'
import type { CancelAction } from '../design-system/CancelAction'
import { capitalize } from '../design-system/capitalize'
import { FormAlert } from '../design-system/FormAlert'
import { ResourceBar } from '../design-system/ResourceBar'
import { SeasonLine } from '../design-system/SeasonLine'
import type { SeasonMarkProps } from '../design-system/SeasonMark'
import { WaitingUpgrades } from '../design-system/WaitingUpgrades'
import { ArmySection } from './ArmySection'
import { buildingCardOf } from './buildingCardOf'
import { LibrarySection } from './LibrarySection'
import type { LiveFief } from './liveFief'
import { SeasonSectionHeading } from './SeasonSectionHeading'
import { seasonSectionMarkOf } from './seasonSectionMarkOf'
import type { Cancel } from './useCancel'
import type { Recall } from './useRecall'
import type { Recruit } from './useRecruit'
import type { Study } from './useStudy'
import type { Upgrade } from './useUpgrade'

export interface FiefScreenProps {
  readonly fief: LiveFief
  readonly upgrade: Upgrade
  readonly cancel: Cancel
  readonly study: Study
  readonly recruit: Recruit
  readonly recall: Recall
}

const { names } = copy

function addressOf({ coordinates }: LiveFief['overview']): string {
  const kingdom = names.kingdoms[coordinates.kingdom] ?? String(coordinates.kingdom)
  return `${kingdom} ${coordinates.province}:${coordinates.plot}`
}

function SeasonLineOf({ fief }: { readonly fief: LiveFief }): ReactElement | null {
  const { season } = fief.overview
  if (season === null) {
    return null
  }
  return (
    <SeasonLine
      season={season.kind}
      headerLine={copy.fief.seasonLine(season.kind, season.year)}
      countdownLine={copy.fief.seasonCountdown(season.kind, fief.seasonRemainingSeconds)}
    />
  )
}

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

function cancelActionOf(cancel: Cancel, target: CancelUpgradeRequest): CancelAction {
  return {
    label: copy.fief.cancel,
    accessibleName: copy.fief.cancelOf(target.building, target.targetLevel),
    isWaiting: cancel.isWaiting,
    onCancel: () => cancel.start(target),
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
    cancel: cancelActionOf(cancel, { building: slot.building, targetLevel: slot.targetLevel }),
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
  const upgrades = fief.waitingUpgrades.map(({ building, targetLevel, remainingSeconds }) => ({
    buildingName: capitalize(names.buildings[building]),
    levelLabel: names.level(targetLevel),
    remainingSeconds,
    cancel: cancelActionOf(cancel, { building, targetLevel }),
  }))
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

export function FiefScreen({
  fief,
  upgrade,
  cancel,
  study,
  recruit,
  recall,
}: FiefScreenProps): ReactElement {
  const { overview, amounts } = fief
  const buildingsHeadingId = useId()
  const resources = ResourceKindSchema.options.map((kind) => ({
    kind,
    label: names.resources[kind],
    amount: amounts[kind],
    ratePerHour: overview.resources[kind].ratePerHour,
    capacity: overview.resources[kind].capacity,
    mark: seasonMarkOf(overview.season, kind),
  }))
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <Link
          to="/feudo/$fiefId/mapa/$province"
          params={{ fiefId: overview.id, province: String(overview.coordinates.province) }}
          className="self-start font-utility text-label text-umber tabular-nums underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-line-strong"
        >
          {addressOf(overview)}
        </Link>
        <h2 className="m-0 font-display text-display-xl text-ink">{overview.name}</h2>
        <SeasonLineOf fief={fief} />
      </header>
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
      <div className="grid items-start gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-2">
          <BuildSlot state={slotStateOf(fief, cancel)} />
          {cancel.refusal !== undefined && <FormAlert message={copy.refusals[cancel.refusal]} />}
          <WaitingUpgradesOf fief={fief} cancel={cancel} />
        </div>
        <section aria-labelledby={buildingsHeadingId} className="flex flex-col gap-3 lg:col-span-2">
          <SeasonSectionHeading
            id={buildingsHeadingId}
            title={copy.fief.buildings}
            mark={seasonSectionMarkOf(overview.season, 'build', copy.fief.buildingsSeasonMark)}
          />
          <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2 xl:grid-cols-3">
            {BuildingKindSchema.options.map((building) => (
              <BuildingItem key={building} building={building} fief={fief} upgrade={upgrade} />
            ))}
          </ul>
        </section>
      </div>
      {overview.buildings.library.level >= 1 && <LibrarySection fief={fief} study={study} />}
      {overview.buildings.barracks.level >= 1 && (
        <ArmySection fief={fief} recruit={recruit} recall={recall} />
      )}
    </div>
  )
}
