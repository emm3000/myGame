import { type UnitKind, UnitKindSchema } from '@mygame/contracts'
import { type ReactElement, useId, useState } from 'react'
import { copy } from '../copy'
import { FormAlert } from '../design-system/FormAlert'
import {
  type RecruitCountdown,
  RecruitSlot,
  type RecruitSlotState,
} from '../design-system/RecruitSlot'
import { UnitCard } from '../design-system/UnitCard'
import type { LiveFief, LiveRecruitOrder } from './liveFief'
import { recruitCountOf, unitCardOf } from './unitCardOf'
import type { Recruit } from './useRecruit'

const { army } = copy

const firstEntry = '1'

function countdownsOf(order: LiveRecruitOrder): ReadonlyArray<RecruitCountdown> {
  const orderComplete = { words: army.orderCompleteIn, remainingSeconds: order.remainingSeconds }
  if (order.count - order.delivered <= 1) {
    return [orderComplete]
  }
  const nextUnit = {
    words: army.nextUnitIn(order.unit),
    remainingSeconds: order.nextUnitRemainingSeconds,
  }
  return [nextUnit, orderComplete]
}

function recruitSlotStateOf(order: LiveRecruitOrder | null): RecruitSlotState {
  if (order === null) {
    return { kind: 'idle', title: army.slot, invitation: army.idleSlot }
  }
  return {
    kind: 'busy',
    title: army.busySlot,
    orderHeading: army.orderHeading,
    orderLine: army.orderLine(order.unit, order.delivered, order.count),
    countdowns: countdownsOf(order),
    remainingSeconds: order.remainingSeconds,
    totalSeconds: order.totalSeconds,
  }
}

function UnitItem({
  unit,
  fief,
  recruit,
}: {
  readonly unit: UnitKind
  readonly fief: LiveFief
  readonly recruit: Recruit
}): ReactElement {
  const [entry, setEntry] = useState(firstEntry)
  const onRecruit = (): void => {
    const count = recruitCountOf(entry)
    if (count !== undefined) {
      recruit.place({ unit, count })
    }
  }
  return (
    <li aria-label={copy.names.units[unit].plural} className="flex flex-col">
      <UnitCard
        {...unitCardOf(unit, entry, fief)}
        entry={entry}
        titleElement="h4"
        isWaiting={recruit.isWaiting}
        onEntryChange={setEntry}
        onRecruit={onRecruit}
      />
    </li>
  )
}

export function ArmySection({
  fief,
  recruit,
}: {
  readonly fief: LiveFief
  readonly recruit: Recruit
}): ReactElement {
  const headingId = useId()
  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-3">
      <h3 id={headingId} className="m-0 font-body text-heading text-ink">
        {army.section}
      </h3>
      <div className="grid items-start gap-6 lg:grid-cols-3">
        <RecruitSlot state={recruitSlotStateOf(fief.recruitOrder)} />
        <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2 lg:col-span-2">
          {UnitKindSchema.options.map((unit) => (
            <UnitItem key={unit} unit={unit} fief={fief} recruit={recruit} />
          ))}
        </ul>
      </div>
      {recruit.refusal !== undefined && <FormAlert message={copy.refusals[recruit.refusal]} />}
    </section>
  )
}
