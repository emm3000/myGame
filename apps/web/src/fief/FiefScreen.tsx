import { type BuildingKind, BuildingKindSchema, type CancelUpgradeRequest } from '@mygame/contracts'
import { Link } from '@tanstack/react-router'
import { type ReactElement, useId } from 'react'
import { copy } from '../copy'
import { BuildingCard } from '../design-system/BuildingCard'
import { BuildSlot, type BuildSlotState } from '../design-system/BuildSlot'
import type { CancelAction } from '../design-system/CancelAction'
import { CargoCard } from '../design-system/CargoCard'
import { capitalize } from '../design-system/capitalize'
import { convoyArtOf } from '../design-system/convoyArtOf'
import { DigestCard, type DigestCardProps } from '../design-system/DigestCard'
import { FormAlert } from '../design-system/FormAlert'
import { focusTargetClass } from '../design-system/focusTargetClass'
import { GoalCard, type GoalCardProps } from '../design-system/GoalCard'
import { Hint, type HintProps } from '../design-system/Hint'
import { SeasonLine } from '../design-system/SeasonLine'
import { WaitingUpgrades } from '../design-system/WaitingUpgrades'
import { type FocusTarget, useFocusTarget } from '../focus/useFocusTarget'
import { hintFocusingAfterDismiss } from '../hints/hintFocusingAfterDismiss'
import { quantitiesOf } from '../resources/quantitiesOf'
import { formatFinish } from '../time/formatFinish'
import { ArmySection } from './ArmySection'
import { buildingCardOf } from './buildingCardOf'
import { LibrarySection } from './LibrarySection'
import type { LiveFief } from './liveFief'
import { SeasonSectionHeading } from './SeasonSectionHeading'
import { seasonSectionMarkOf } from './seasonSectionMarkOf'
import { sectionAnchors } from './sectionAnchors'
import type { Cancel } from './useCancel'
import type { Recall } from './useRecall'
import type { Recruit } from './useRecruit'
import type { Study } from './useStudy'
import type { Upgrade } from './useUpgrade'

export interface FiefScreenProps {
  readonly fief: LiveFief
  readonly fiefName: FocusTarget<HTMLHeadingElement>
  readonly upgrade: Upgrade
  readonly cancel: Cancel
  readonly study: Study
  readonly recruit: Recruit
  readonly recall: Recall
  readonly digest: DigestCardProps | undefined
  readonly goal: GoalCardProps | undefined
  readonly hint: ScreenHint | undefined
}

export interface ScreenHint {
  readonly kind: 'seasons' | 'queue' | 'library' | 'barracks'
  readonly props: HintProps
}

const hintAt = (hint: ScreenHint | undefined, kind: ScreenHint['kind']): HintProps | undefined =>
  hint?.kind === kind ? hint.props : undefined

function StandaloneHint({
  hint,
  focusAfterDismiss,
}: {
  readonly hint: HintProps | undefined
  readonly focusAfterDismiss: () => void
}): ReactElement | null {
  return hint === undefined ? null : <Hint {...hintFocusingAfterDismiss(hint, focusAfterDismiss)} />
}

const { names } = copy

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

function IncomingCargoOf({ fief }: { readonly fief: LiveFief }): ReactElement | null {
  const { incomingCargo } = fief.overview
  if (incomingCargo === null) {
    return null
  }
  const { from, cargo } = incomingCargo
  return (
    <div id={sectionAnchors.incomingCargo} className="flex flex-col md:scroll-mt-status">
      <CargoCard
        title={copy.fief.incomingCargo}
        artSrc={convoyArtOf()}
        origin={copy.fief.cargoOrigin(from.name, from.province, from.plot)}
        amounts={copy.fief.cargoAmounts(quantitiesOf(cargo))}
        countdown={{
          words: copy.fief.cargoArrivalHeading,
          time: formatFinish(fief.incomingCargoRemainingSeconds, fief.at),
        }}
        elapsedSeconds={fief.incomingCargoTotalSeconds - fief.incomingCargoRemainingSeconds}
        totalSeconds={fief.incomingCargoTotalSeconds}
      />
    </div>
  )
}

function NoticesRow({
  digest,
  goal,
}: {
  readonly digest: DigestCardProps | undefined
  readonly goal: GoalCardProps | undefined
}): ReactElement | null {
  if (digest === undefined && goal === undefined) {
    return null
  }
  return (
    <div className="grid items-start gap-4 lg:grid-cols-3">
      {digest !== undefined && (
        <div className="flex flex-col lg:col-span-2">
          <DigestCard {...digest} />
        </div>
      )}
      {goal !== undefined && <GoalCard {...goal} />}
    </div>
  )
}

function cancelActionOf(
  cancel: Cancel,
  target: CancelUpgradeRequest,
  onCancelled: () => void,
): CancelAction {
  return {
    label: copy.fief.cancel,
    accessibleName: copy.fief.cancelOf(target.building, target.targetLevel),
    isWaiting: cancel.isWaiting,
    onCancel: () => cancel.start(target, onCancelled),
  }
}

function slotStateOf(fief: LiveFief, cancel: Cancel, onCancelled: () => void): BuildSlotState {
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
    time: formatFinish(fief.slotRemainingSeconds, fief.at),
    totalSeconds: fief.slotTotalSeconds,
    finishedLabel: copy.fief.finished,
    cancel: cancelActionOf(
      cancel,
      { building: slot.building, targetLevel: slot.targetLevel },
      onCancelled,
    ),
    refund: copy.fief.cancelRefund,
    ...building,
  }
}

function WaitingUpgradesOf({
  fief,
  cancel,
  onCancelled,
}: {
  readonly fief: LiveFief
  readonly cancel: Cancel
  readonly onCancelled: () => void
}): ReactElement | null {
  const last = fief.waitingUpgrades.at(-1)
  if (last === undefined) {
    return null
  }
  const upgrades = fief.waitingUpgrades.map(({ building, targetLevel, remainingSeconds }) => ({
    buildingName: capitalize(names.buildings[building]),
    levelLabel: names.level(targetLevel),
    remainingSeconds,
    time: formatFinish(remainingSeconds, fief.at),
    cancel: cancelActionOf(cancel, { building, targetLevel }, onCancelled),
    refund: copy.fief.cancelRefund,
  }))
  return (
    <WaitingUpgrades
      title={names.buildQueue}
      emptiesAt={formatFinish(last.remainingSeconds, fief.at)}
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
  fiefName,
  upgrade,
  cancel,
  study,
  recruit,
  recall,
  digest,
  goal,
  hint,
}: FiefScreenProps): ReactElement {
  const { overview } = fief
  const buildingsHeadingId = useId()
  const slotTitle = useFocusTarget<HTMLSpanElement>()
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <Link
          to="/feudo/$fiefId/mapa/$province"
          params={{ fiefId: overview.id, province: String(overview.coordinates.province) }}
          className="inline-flex min-h-control items-center self-start font-utility text-label text-umber tabular-nums underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-line-strong"
        >
          {names.address(overview.coordinates)}
        </Link>
        <h2
          ref={fiefName.ref}
          tabIndex={-1}
          className={`m-0 self-start rounded-sm font-display text-display-xl text-ink ${focusTargetClass}`}
        >
          {overview.name}
        </h2>
        <SeasonLineOf fief={fief} />
        <StandaloneHint hint={hintAt(hint, 'seasons')} focusAfterDismiss={fiefName.focus} />
      </header>
      <NoticesRow digest={digest} goal={goal} />
      <div className="grid items-start gap-6 lg:grid-cols-3">
        <div id={sectionAnchors.build} className="flex flex-col gap-2 md:scroll-mt-status">
          <IncomingCargoOf fief={fief} />
          <BuildSlot state={slotStateOf(fief, cancel, slotTitle.focus)} titleRef={slotTitle.ref} />
          <StandaloneHint hint={hintAt(hint, 'queue')} focusAfterDismiss={slotTitle.focus} />
          {cancel.refusal !== undefined && <FormAlert message={copy.refusals[cancel.refusal]} />}
          <WaitingUpgradesOf fief={fief} cancel={cancel} onCancelled={slotTitle.focus} />
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
      {overview.buildings.library.level >= 1 && (
        <LibrarySection fief={fief} study={study} hint={hintAt(hint, 'library')} />
      )}
      {overview.buildings.barracks.level >= 1 && (
        <ArmySection
          fief={fief}
          recruit={recruit}
          recall={recall}
          hint={hintAt(hint, 'barracks')}
        />
      )}
    </div>
  )
}
