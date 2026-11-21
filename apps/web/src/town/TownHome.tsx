import {
  type BuildingKind,
  BuildingKindSchema,
  type StopBuildingWork,
  type TipKind,
} from '@mygame/contracts'
import { type ReactElement, useId } from 'react'
import type { PlayerCopy } from '../copy/PlayerCopy'
import { usePlayerCopy } from '../copy/usePlayerCopy'
import { BuildSlot, type BuildSlotState } from '../design-system/BuildSlot'
import type { CancelAction } from '../design-system/CancelAction'
import { FormAlert } from '../design-system/FormAlert'
import { focusTargetClass } from '../design-system/focusTargetClass'
import { LabelText } from '../design-system/LabelText'
import { spokenLanguageOf } from '../design-system/spokenLanguageOf'
import { spokenLineOf } from '../design-system/spokenLineOf'
import { TextLink } from '../design-system/TextLink'
import { WaitingUpgrades } from '../design-system/WaitingUpgrades'
import { type FocusTarget, useFocusTarget } from '../focus/useFocusTarget'
import { MapRow } from '../map/MapRow'
import { PlacementOffer } from '../placement/PlacementOffer'
import type { PlacementOfferState } from '../placement/usePlacementOffer'
import { refusalLineOf } from '../refusals/refusalLineOf'
import { dueCountOf } from './dueCountOf'
import { finishTimeOf } from './finishTimeOf'
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
  readonly placementOffer: PlacementOfferState
}

const placesInOrder: ReadonlyArray<BuildingKind> = [
  'school',
  ...BuildingKindSchema.exclude(['school']).options,
]

interface WorkStop {
  readonly work: TownWork
  readonly onStopped: () => void
}

function stopActionOf(
  copy: PlayerCopy,
  { work, onStopped }: WorkStop,
  target: StopBuildingWork,
): CancelAction {
  const stopOf = copy.chrome((catalog) =>
    catalog.townWorkStopOf({ place: placeNameOf(catalog, target.building), level: target.level }),
  )
  return {
    label: copy.chrome((catalog) => catalog.townWorkStop()),
    accessibleName: stopOf,
    isWaiting: work.isStopping,
    onCancel: () => work.stop(target, onStopped),
  }
}

function slotStateOf(copy: PlayerCopy, town: LiveTown, stop: WorkStop): BuildSlotState {
  const { slot } = town
  const title = copy.chrome((catalog) => catalog.townWorkTitle())
  if (slot === null) {
    return { kind: 'idle', title, invitation: copy.chrome((catalog) => catalog.townWorkIdle()) }
  }
  const place = {
    buildingName: copy.chrome((catalog) => placeNameOf(catalog, slot.building)),
    levelLabel: copy.chrome((catalog) => catalog.townLevel({ level: slot.level })),
  }
  if (slot.remainingSeconds <= 0) {
    return {
      kind: 'justFinished',
      title,
      message: copy.chrome((catalog) => catalog.townWorkDone()),
      ...place,
    }
  }
  return {
    kind: 'busy',
    title,
    remainingSeconds: slot.remainingSeconds,
    time: finishTimeOf(copy, slot.remainingSeconds, town.at),
    totalSeconds: slot.totalSeconds,
    finishedLabel: copy.chrome((catalog) => catalog.townWorkReady()),
    cancel: stopActionOf(copy, stop, { building: slot.building, level: slot.level }),
    refund: copy.chrome((catalog) => catalog.townWorkRefund()),
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
  const copy = usePlayerCopy()
  if (last === undefined) {
    return null
  }
  const entries = town.waitingList.map(({ building, level, remainingSeconds }) => ({
    buildingName: copy.chrome((catalog) => placeNameOf(catalog, building)),
    levelLabel: copy.chrome((catalog) => catalog.townLevel({ level })),
    remainingSeconds,
    time: finishTimeOf(copy, remainingSeconds, town.at),
    cancel: stopActionOf(copy, { work, onStopped }, { building, level }),
    refund: copy.chrome((catalog) => catalog.townWorkRefund()),
  }))
  return (
    <WaitingUpgrades
      title={copy.chrome((catalog) => catalog.townWorkWaitingList())}
      emptiesAt={finishTimeOf(copy, last.remainingSeconds, town.at)}
      upgrades={entries}
      finishedLabel={copy.chrome((catalog) => catalog.townWorkReady())}
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
  const copy = usePlayerCopy()
  const name = copy.chrome((catalog) => placeNameOf(catalog, place))
  return (
    <li
      aria-label={spokenLineOf(name)}
      lang={spokenLanguageOf(name)}
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
        <FormAlert
          message={copy.fixedCopy((catalog) =>
            refusalLineOf(catalog, refused.refusal, refused.error),
          )}
        />
      )}
      {place === 'school' && (
        <TextLink to="/school">
          <LabelText label={copy.chrome((catalog) => catalog.townGoToSchool())} />
        </TextLink>
      )}
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
  placementOffer,
}: TownHomeProps): ReactElement {
  const { overview } = town
  const placesTitleId = useId()
  const targets = useTipTargets()
  const slotTitle = targets.refs.work
  const stopRefused = work.stopRefused
  const copy = usePlayerCopy()
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
        <PlacementOffer offer={placementOffer} />
      </div>
      <div className="flex min-w-0 flex-col gap-6 lg:row-span-2">
        <TownSkyline buildings={overview.buildings} raised={registered.places} />
        <TownStocks town={town} titleRef={targets.refs.stocks.ref} />
        {tipAt('stocks')}
      </div>
      <div className="flex min-w-0 flex-col gap-4 lg:row-span-2">
        <BuildSlot
          state={slotStateOf(copy, town, { work, onStopped: slotTitle.focus })}
          titleRef={slotTitle.ref}
        />
        {stopRefused !== undefined && (
          <FormAlert
            message={copy.fixedCopy((catalog) =>
              refusalLineOf(catalog, stopRefused.refusal, stopRefused.error),
            )}
          />
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
          <LabelText
            label={copy.chrome((catalog) =>
              overview.label === 'city'
                ? catalog.townPlacesTitleCity()
                : catalog.townPlacesTitleTown(),
            )}
          />
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
