import {
  townGoToSchool,
  townLevel,
  townPlacesTitleCity,
  townPlacesTitleTown,
  townWorkDone,
  townWorkIdle,
  townWorkReady,
  townWorkRefund,
  townWorkStop,
  townWorkStopOf,
  townWorkTitle,
  townWorkWaitingList,
} from '@mygame/catalog'
import {
  type BuildingKind,
  BuildingKindSchema,
  type StopBuildingWork,
  type TipKind,
} from '@mygame/contracts'
import { type ReactElement, useId } from 'react'
import { BuildSlot, type BuildSlotState } from '../design-system/BuildSlot'
import type { CancelAction } from '../design-system/CancelAction'
import { FormAlert } from '../design-system/FormAlert'
import { focusTargetClass } from '../design-system/focusTargetClass'
import { TextLink } from '../design-system/TextLink'
import { WaitingUpgrades } from '../design-system/WaitingUpgrades'
import { type FocusTarget, useFocusTarget } from '../focus/useFocusTarget'
import { MapRow } from '../map/MapRow'
import { refusalLineOf } from '../refusals/refusalLineOf'
import { formatFinish } from '../time/formatFinish'
import { dueCountOf } from './dueCountOf'
import type { LiveTown } from './liveTown'
import { NextStepCard } from './NextStepCard'
import { OfficeSection } from './OfficeSection'
import { PlaceRow } from './PlaceRow'
import { placeNameOf } from './placeNameOf'
import { levelBeforeOf, type Registered } from './registeredBetween'
import { TipNote, type TipPlace } from './TipNote'
import { TownDoors } from './TownDoors'
import { TownSkyline } from './TownSkyline'
import { TownStocks } from './TownStocks'
import type { TownGuidance } from './useTownGuidance'
import type { TownHiring } from './useTownHiring'
import type { TownWork } from './useTownWork'

export interface TownHomeProps {
  readonly town: LiveTown
  readonly registered: Registered
  readonly work: TownWork
  readonly hiring: TownHiring
  readonly guidance: TownGuidance
}

const placesInOrder: ReadonlyArray<BuildingKind> = [
  'school',
  ...BuildingKindSchema.exclude(['school']).options,
]

function stopActionOf(
  work: TownWork,
  target: StopBuildingWork,
  onStopped: () => void,
): CancelAction {
  return {
    label: townWorkStop(),
    accessibleName: townWorkStopOf({ place: placeNameOf(target.building), level: target.level }),
    isWaiting: work.isStopping,
    onCancel: () => work.stop(target, onStopped),
  }
}

function slotStateOf(town: LiveTown, work: TownWork, onStopped: () => void): BuildSlotState {
  const { slot } = town
  if (slot === null) {
    return { kind: 'idle', title: townWorkTitle(), invitation: townWorkIdle() }
  }
  const place = {
    buildingName: placeNameOf(slot.building),
    levelLabel: townLevel({ level: slot.level }),
  }
  if (slot.remainingSeconds <= 0) {
    return { kind: 'justFinished', title: townWorkTitle(), message: townWorkDone(), ...place }
  }
  return {
    kind: 'busy',
    title: townWorkTitle(),
    remainingSeconds: slot.remainingSeconds,
    time: formatFinish(slot.remainingSeconds, town.at),
    totalSeconds: slot.totalSeconds,
    finishedLabel: townWorkReady(),
    cancel: stopActionOf(work, { building: slot.building, level: slot.level }, onStopped),
    refund: townWorkRefund(),
    ...place,
  }
}

function WaitingList({
  town,
  work,
  onStopped,
}: {
  readonly town: LiveTown
  readonly work: TownWork
  readonly onStopped: () => void
}): ReactElement | null {
  const last = town.waitingList.at(-1)
  if (last === undefined) {
    return null
  }
  const entries = town.waitingList.map(({ building, level, remainingSeconds }) => ({
    buildingName: placeNameOf(building),
    levelLabel: townLevel({ level }),
    remainingSeconds,
    time: formatFinish(remainingSeconds, town.at),
    cancel: stopActionOf(work, { building, level }, onStopped),
    refund: townWorkRefund(),
  }))
  return (
    <WaitingUpgrades
      title={townWorkWaitingList()}
      emptiesAt={formatFinish(last.remainingSeconds, town.at)}
      upgrades={entries}
      finishedLabel={townWorkReady()}
    />
  )
}

function PlaceItem({
  place,
  town,
  levelBefore,
  work,
}: {
  readonly place: BuildingKind
  readonly town: LiveTown
  readonly levelBefore: number
  readonly work: TownWork
}): ReactElement {
  const refused = work.startRefused?.subject === place ? work.startRefused : undefined
  return (
    <li
      aria-label={placeNameOf(place)}
      className="flex flex-col gap-2 border-line border-t py-4 first:border-t-0"
    >
      <PlaceRow
        place={place}
        town={town}
        levelBefore={levelBefore}
        isWaiting={work.isStarting}
        onBuild={() => work.start(place)}
      />
      {refused !== undefined && (
        <FormAlert message={refusalLineOf(refused.refusal, refused.error)} />
      )}
      {place === 'school' && <TextLink to="/school">{townGoToSchool()}</TextLink>}
    </li>
  )
}

function useTipTargets(): {
  readonly refs: {
    readonly stocks: FocusTarget<HTMLHeadingElement>
    readonly work: FocusTarget<HTMLSpanElement>
    readonly places: FocusTarget<HTMLHeadingElement>
    readonly office: FocusTarget<HTMLHeadingElement>
  }
  readonly focus: (place: TipPlace) => void
} {
  const refs = {
    stocks: useFocusTarget<HTMLHeadingElement>(),
    work: useFocusTarget<HTMLSpanElement>(),
    places: useFocusTarget<HTMLHeadingElement>(),
    office: useFocusTarget<HTMLHeadingElement>(),
  }
  return { refs, focus: (place) => refs[place].focus() }
}

export function TownHome({
  town,
  registered,
  work,
  hiring,
  guidance,
}: TownHomeProps): ReactElement {
  const { overview } = town
  const placesTitleId = useId()
  const targets = useTipTargets()
  const slotTitle = targets.refs.work
  const stopRefused = work.stopRefused
  const tipAt = (place: TipPlace): ReactElement => (
    <TipNote
      tip={guidance.tip}
      place={place}
      onClose={(tip: TipKind) => {
        guidance.closeTip(tip)
        targets.focus(place)
      }}
    />
  )
  return (
    <div className="grid items-start gap-6 lg:grid-cols-2">
      <div className="flex min-w-0 flex-col gap-6">
        <NextStepCard town={town} goal={guidance.goal} onGoalClose={guidance.closeGoal} />
        <TownDoors dueCount={dueCountOf(town)} />
      </div>
      <div className="flex min-w-0 flex-col gap-6 lg:row-span-2">
        <TownSkyline buildings={overview.buildings} raised={registered.places} />
        <TownStocks town={town} titleRef={targets.refs.stocks.ref} />
        {tipAt('stocks')}
      </div>
      <div className="flex min-w-0 flex-col gap-4 lg:row-span-2">
        <BuildSlot state={slotStateOf(town, work, slotTitle.focus)} titleRef={slotTitle.ref} />
        {stopRefused !== undefined && (
          <FormAlert message={refusalLineOf(stopRefused.refusal, stopRefused.error)} />
        )}
        <WaitingList town={town} work={work} onStopped={slotTitle.focus} />
        {tipAt('work')}
      </div>
      <section aria-labelledby={placesTitleId} className="flex min-w-0 flex-col gap-1">
        {tipAt('places')}
        <h3
          id={placesTitleId}
          ref={targets.refs.places.ref}
          tabIndex={-1}
          className={`m-0 font-sans text-heading text-ink ${focusTargetClass}`}
        >
          {overview.label === 'city' ? townPlacesTitleCity() : townPlacesTitleTown()}
        </h3>
        <ul className="m-0 flex list-none flex-col p-0">
          {placesInOrder.map((place) => (
            <PlaceItem
              key={place}
              place={place}
              town={town}
              levelBefore={levelBeforeOf(registered.places, place, overview.buildings[place].level)}
              work={work}
            />
          ))}
        </ul>
      </section>
      <div className="flex min-w-0 flex-col gap-6">
        {tipAt('office')}
        <OfficeSection town={town} hiring={hiring} titleRef={targets.refs.office.ref} />
        <MapRow />
      </div>
    </div>
  )
}
