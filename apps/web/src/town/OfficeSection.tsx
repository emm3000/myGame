import {
  namesPlacesOffice,
  townOfficeDelivered,
  townOfficeDone,
  townOfficeHiring,
  townOfficeIdle,
  townOfficeRefund,
  townOfficeStop,
  townWorkReady,
} from '@mygame/catalog'
import { type HireKind, HireKindSchema } from '@mygame/contracts'
import { type ReactElement, useId, useState } from 'react'
import { BuildSlot, type BuildSlotState } from '../design-system/BuildSlot'
import { FormAlert } from '../design-system/FormAlert'
import { useFocusTarget } from '../focus/useFocusTarget'
import { hiringRefusalLineOf } from '../refusals/hiringRefusalLineOf'
import { refusalLineOf } from '../refusals/refusalLineOf'
import { formatFinish } from '../time/formatFinish'
import { HireCard } from './HireCard'
import { hireCardOf, hireCountOf } from './hireCardOf'
import { hireWordsOf } from './hireWordsOf'
import type { LiveTown } from './liveTown'
import type { TownHiring } from './useTownHiring'

const firstEntry = '1'

function slotStateOf(town: LiveTown, hiring: TownHiring, onStopped: () => void): BuildSlotState {
  const live = town.hiringOrder
  const answered = town.overview.hiring.order
  if (live === null || answered === null) {
    return { kind: 'idle', title: townOfficeHiring(), invitation: townOfficeIdle() }
  }
  const order = {
    title: townOfficeHiring(),
    buildingName: hireWordsOf(live.hire).name(),
    levelLabel: townOfficeDelivered({ delivered: live.delivered, count: live.count }),
  }
  if (live.remainingSeconds <= 0) {
    return { kind: 'justFinished', message: townOfficeDone(), ...order }
  }
  return {
    kind: 'busy',
    remainingSeconds: live.remainingSeconds,
    time: formatFinish(live.remainingSeconds, town.at),
    totalSeconds: live.totalSeconds,
    finishedLabel: townWorkReady(),
    cancel: {
      label: townOfficeStop(),
      accessibleName: hireWordsOf(answered.hire).stopOf(),
      isWaiting: hiring.isStopping,
      onCancel: () =>
        hiring.stop({ hire: answered.hire, startedAt: answered.startedAt }, onStopped),
    },
    refund: townOfficeRefund(),
    ...order,
  }
}

function HireItem({
  hire,
  town,
  hiring,
}: {
  readonly hire: HireKind
  readonly town: LiveTown
  readonly hiring: TownHiring
}): ReactElement {
  const [entry, setEntry] = useState(firstEntry)
  const card = hireCardOf(hire, entry, town)
  const refused = hiring.placeRefused?.subject === hire ? hiring.placeRefused : undefined
  const onHire = (): void => {
    const count = hireCountOf(entry)
    if (count !== undefined) {
      hiring.place({ hire, count })
    }
  }
  return (
    <li
      aria-label={card.name}
      className="flex flex-col gap-2 border-line border-t py-4 first:border-t-0"
    >
      <HireCard
        card={card}
        entry={entry}
        isWaiting={hiring.placingHire === hire}
        onEntryChange={setEntry}
        onHire={onHire}
      />
      {refused !== undefined && (
        <FormAlert message={hiringRefusalLineOf(refused.refusal, refused.error)} />
      )}
    </li>
  )
}

export function OfficeSection({
  town,
  hiring,
}: {
  readonly town: LiveTown
  readonly hiring: TownHiring
}): ReactElement {
  const titleId = useId()
  const slotTitle = useFocusTarget<HTMLSpanElement>()
  const stopRefused = hiring.stopRefused
  return (
    <section aria-labelledby={titleId} className="flex min-w-0 flex-col gap-4">
      <h3 id={titleId} className="m-0 font-sans text-heading text-ink">
        {namesPlacesOffice()}
      </h3>
      <BuildSlot state={slotStateOf(town, hiring, slotTitle.focus)} titleRef={slotTitle.ref} />
      {stopRefused !== undefined && (
        <FormAlert message={refusalLineOf(stopRefused.refusal, stopRefused.error)} />
      )}
      <ul className="m-0 flex list-none flex-col p-0">
        {HireKindSchema.options.map((hire) => (
          <HireItem key={hire} hire={hire} town={town} hiring={hiring} />
        ))}
      </ul>
    </section>
  )
}
