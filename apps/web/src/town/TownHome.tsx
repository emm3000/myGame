import {
  townGoToSchool,
  townLabelCity,
  townLabelTown,
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
} from '@mygame/contracts/town'
import { type ReactElement, useId } from 'react'
import { BuildingCard } from '../design-system/BuildingCard'
import { BuildSlot, type BuildSlotState } from '../design-system/BuildSlot'
import type { CancelAction } from '../design-system/CancelAction'
import { FormAlert } from '../design-system/FormAlert'
import { PlaceArt } from '../design-system/PlaceArt'
import { placeArtOf } from '../design-system/placeArtOf'
import { TextLink } from '../design-system/TextLink'
import { WaitingUpgrades } from '../design-system/WaitingUpgrades'
import { useFocusTarget } from '../focus/useFocusTarget'
import { refusalLineOf } from '../refusals/refusalLineOf'
import { formatFinish } from '../time/formatFinish'
import type { LiveTown } from './liveTown'
import { NextStepCard } from './NextStepCard'
import { placeCardOf } from './placeCardOf'
import { placeNameOf } from './placeNameOf'
import { TownStocks } from './TownStocks'
import type { TownWork } from './useTownWork'

export interface TownHomeProps {
  readonly town: LiveTown
  readonly work: TownWork
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
  work,
}: {
  readonly place: BuildingKind
  readonly town: LiveTown
  readonly work: TownWork
}): ReactElement {
  const refused = work.startRefused?.subject === place ? work.startRefused : undefined
  return (
    <li aria-label={placeNameOf(place)} className="flex flex-col gap-2">
      <BuildingCard
        {...placeCardOf(place, town)}
        art={<PlaceArt shapes={placeArtOf(place, town.overview.buildings[place].level)} />}
        actionTone="quiet"
        titleElement="h4"
        isWaiting={work.isStarting}
        onUpgrade={() => work.start(place)}
      />
      {refused !== undefined && (
        <FormAlert message={refusalLineOf(refused.refusal, refused.error)} />
      )}
      {place === 'school' && <TextLink to="/school">{townGoToSchool()}</TextLink>}
    </li>
  )
}

export function TownHome({ town, work }: TownHomeProps): ReactElement {
  const { overview } = town
  const placesTitleId = useId()
  const slotTitle = useFocusTarget<HTMLSpanElement>()
  const stopRefused = work.stopRefused
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 className="m-0 font-sans text-display text-ink">{overview.name}</h2>
        <span className="rounded-pill border border-line-strong bg-surface-raised px-2 font-sans text-label text-ink">
          {overview.label === 'city' ? townLabelCity() : townLabelTown()}
        </span>
      </header>
      <NextStepCard town={town} />
      <div className="grid items-start gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-4">
          <TownStocks overview={overview} stocks={town.stocks} />
          <BuildSlot state={slotStateOf(town, work, slotTitle.focus)} titleRef={slotTitle.ref} />
          {stopRefused !== undefined && (
            <FormAlert message={refusalLineOf(stopRefused.refusal, stopRefused.error)} />
          )}
          <WaitingList town={town} work={work} onStopped={slotTitle.focus} />
        </div>
        <section aria-labelledby={placesTitleId} className="flex flex-col gap-3 lg:col-span-2">
          <h3 id={placesTitleId} className="m-0 font-sans text-heading text-ink">
            {overview.label === 'city' ? townPlacesTitleCity() : townPlacesTitleTown()}
          </h3>
          <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2 xl:grid-cols-3">
            {placesInOrder.map((place) => (
              <PlaceItem key={place} place={place} town={town} work={work} />
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}
