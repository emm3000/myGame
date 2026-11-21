import { type HireKind, HireKindSchema } from '@mygame/contracts'
import { type ReactElement, type Ref, useId, useState } from 'react'
import type { PlayerCopy } from '../copy/PlayerCopy'
import { usePlayerCopy } from '../copy/usePlayerCopy'
import { BuildSlot, type BuildSlotState } from '../design-system/BuildSlot'
import { FormAlert } from '../design-system/FormAlert'
import { focusTargetClass } from '../design-system/focusTargetClass'
import { LabelText } from '../design-system/LabelText'
import { lineLabelOf } from '../design-system/lineLabelOf'
import { spokenLineOf } from '../design-system/spokenLineOf'
import { useFocusTarget } from '../focus/useFocusTarget'
import { hiringRefusalLineOf } from '../refusals/hiringRefusalLineOf'
import { refusalLineOf } from '../refusals/refusalLineOf'
import { finishTimeOf } from './finishTimeOf'
import { HireCard } from './HireCard'
import { hireCardOf, hireCountOf } from './hireCardOf'
import { hireWordsOf } from './hireWordsOf'
import type { LiveTown } from './liveTown'
import type { TownHiring } from './useTownHiring'

const firstEntry = '1'

interface HiringStop {
  readonly hiring: TownHiring
  readonly onStopped: () => void
}

function slotStateOf(
  copy: PlayerCopy,
  town: LiveTown,
  { hiring, onStopped }: HiringStop,
): BuildSlotState {
  const live = town.hiringOrder
  const answered = town.overview.hiring.order
  const title = copy.chrome((catalog) => catalog.townOfficeHiring())
  if (live === null || answered === null) {
    return { kind: 'idle', title, invitation: copy.chrome((catalog) => catalog.townOfficeIdle()) }
  }
  const order = {
    title,
    buildingName: copy.chrome(hireWordsOf(live.hire).name),
    levelLabel: copy.chrome((catalog) =>
      catalog.townOfficeDelivered({ delivered: live.delivered, count: live.count }),
    ),
  }
  if (live.remainingSeconds <= 0) {
    const message = copy.chrome((catalog) => catalog.townOfficeDone())
    return { kind: 'justFinished', message, ...order }
  }
  return {
    kind: 'busy',
    remainingSeconds: live.remainingSeconds,
    time: finishTimeOf(copy, live.remainingSeconds, town.at),
    totalSeconds: live.totalSeconds,
    finishedLabel: copy.chrome((catalog) => catalog.townWorkReady()),
    cancel: {
      label: copy.chrome((catalog) => catalog.townOfficeStop()),
      accessibleName: spokenLineOf(copy.chrome(hireWordsOf(answered.hire).stopOf)),
      isWaiting: hiring.isStopping,
      onCancel: () =>
        hiring.stop({ hire: answered.hire, startedAt: answered.startedAt }, onStopped),
    },
    refund: copy.chrome((catalog) => catalog.townOfficeRefund()),
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
  const copy = usePlayerCopy()
  const card = hireCardOf(copy, hire, entry, town)
  const refused = hiring.placeRefused?.subject === hire ? hiring.placeRefused : undefined
  const onHire = (): void => {
    const count = hireCountOf(entry)
    if (count !== undefined) {
      hiring.place({ hire, count })
    }
  }
  return (
    <li
      aria-label={spokenLineOf(card.name)}
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
        <FormAlert
          message={lineLabelOf(hiringRefusalLineOf(refused.refusal, refused.error), 'es')}
        />
      )}
    </li>
  )
}

export function OfficeSection({
  town,
  hiring,
  titleRef,
}: {
  readonly town: LiveTown
  readonly hiring: TownHiring
  readonly titleRef: Ref<HTMLHeadingElement>
}): ReactElement {
  const titleId = useId()
  const slotTitle = useFocusTarget<HTMLSpanElement>()
  const stopRefused = hiring.stopRefused
  const copy = usePlayerCopy()
  return (
    <section aria-labelledby={titleId} className="flex min-w-0 flex-col gap-4">
      <h3
        id={titleId}
        ref={titleRef}
        tabIndex={-1}
        className={`m-0 font-sans text-heading text-ink ${focusTargetClass}`}
      >
        <LabelText label={copy.chrome((catalog) => catalog.namesPlacesOffice())} />
      </h3>
      <BuildSlot
        state={slotStateOf(copy, town, { hiring, onStopped: slotTitle.focus })}
        titleRef={slotTitle.ref}
      />
      {stopRefused !== undefined && (
        <FormAlert
          message={copy.fixedCopy((catalog) =>
            refusalLineOf(catalog, stopRefused.refusal, stopRefused.error),
          )}
        />
      )}
      <ul className="m-0 flex list-none flex-col p-0">
        {HireKindSchema.options.map((hire) => (
          <HireItem key={hire} hire={hire} town={town} hiring={hiring} />
        ))}
      </ul>
    </section>
  )
}
