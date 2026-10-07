import { type UnitKind, UnitKindSchema } from '@mygame/contracts'
import { type ReactElement, useId, useState } from 'react'
import { copy } from '../copy'
import type { CancelAction } from '../design-system/CancelAction'
import type { SlotCountdown } from '../design-system/CountdownLine'
import { FormAlert } from '../design-system/FormAlert'
import { Hint, type HintProps } from '../design-system/Hint'
import { LockedUnitCard } from '../design-system/LockedUnitCard'
import { MarchSlot, type MarchSlotState } from '../design-system/MarchSlot'
import type { PreviewLine } from '../design-system/PreviewLines'
import { RecruitSlot, type RecruitSlotState } from '../design-system/RecruitSlot'
import { UnitCard } from '../design-system/UnitCard'
import { useFocusTarget } from '../focus/useFocusTarget'
import { hintFocusingAfterDismiss } from '../hints/hintFocusingAfterDismiss'
import { quantitiesOf } from '../resources/quantitiesOf'
import { formatFinish } from '../time/formatFinish'
import { costTimes } from './costTimes'
import {
  isFoundingOnTheWay,
  type LiveFief,
  type LiveMarch,
  type LiveRecruitOrder,
} from './liveFief'
import { marchCountdownOf } from './marchCountdownOf'
import { marchPhaseLineOf } from './marchPhaseLineOf'
import { SeasonSectionHeading } from './SeasonSectionHeading'
import { seasonSectionMarkOf } from './seasonSectionMarkOf'
import { sectionAnchors } from './sectionAnchors'
import { recruitCountOf, type UnitCardContent, unitCardOf } from './unitCardOf'
import type { Recall } from './useRecall'
import type { Recruit } from './useRecruit'

const { army, march, founding, transport } = copy

const firstEntry = '1'

function recruitRefusalLineOf(refused: NonNullable<Recruit['refused']>, fief: LiveFief): string {
  const { subject, refusal } = refused
  if (refusal === 'BarracksTooLow') {
    return army.barracksTooLowRefusal(
      subject.unit,
      fief.overview.unitTerms[subject.unit].barracksLevel,
    )
  }
  return copy.refusals[refusal]
}

function orderCompleteOf(order: LiveRecruitOrder, at: Date): SlotCountdown {
  return { words: army.orderCompleteIn, time: formatFinish(order.remainingSeconds, at) }
}

function levyRefundOf(order: LiveRecruitOrder, fief: LiveFief): string {
  const undelivered = order.count - order.delivered
  const refund = costTimes(fief.overview.recruitTerms[order.unit].cost, undelivered)
  return army.cancelRefund(order.unit, undelivered, quantitiesOf(refund))
}

function recruitSlotStateOf(
  fief: LiveFief,
  recruit: Recruit,
  onCancelled: () => void,
): RecruitSlotState {
  const order = fief.recruitOrder
  const answered = fief.overview.recruitOrder
  if (order === null || answered === null) {
    return { kind: 'idle', title: army.slot, invitation: army.idleSlot }
  }
  return {
    kind: 'busy',
    title: army.busySlot,
    orderHeading: army.orderHeading,
    orderLine: army.orderLine(order.unit, order.delivered, order.count),
    countdown: orderCompleteOf(order, fief.at),
    remainingSeconds: order.remainingSeconds,
    totalSeconds: order.totalSeconds,
    cancel: {
      label: army.cancel,
      accessibleName: army.cancelOf(answered.unit, answered.count),
      isWaiting: recruit.isWaiting,
      onCancel: () =>
        recruit.cancel({ unit: answered.unit, startedAt: answered.startedAt }, onCancelled),
    },
    refund: levyRefundOf(order, fief),
  }
}

type AnsweredMarch = NonNullable<LiveFief['overview']['march']>

function lootOf(answered: AnsweredMarch): PreviewLine | null {
  if (answered.order === 'transport') {
    return null
  }
  const loot = quantitiesOf(answered.loot)
  return loot.length === 0
    ? null
    : { heading: march.lootHeading, value: march.loot(loot), isNumeral: false }
}

function recallOf(answered: AnsweredMarch, recall: Recall, onRecalled: () => void): CancelAction {
  return {
    label: march.recall,
    accessibleName: march.recallOf(answered.units),
    isWaiting: recall.isWaiting,
    onCancel: () => recall.start({ departedAt: answered.departedAt }, onRecalled),
  }
}

function detailLineOf(live: LiveMarch, answered: AnsweredMarch): PreviewLine | null {
  if (answered.order === 'transport') {
    const isCarrying = live.phase === 'outbound' || answered.recalledAt !== null
    return isCarrying
      ? {
          heading: transport.cargoHeading,
          value: transport.cargo(quantitiesOf(answered.cargo)),
          isNumeral: false,
        }
      : null
  }
  if (answered.order === 'found') {
    return answered.recalledAt === null
      ? { heading: founding.newFiefHeading, value: answered.name, isNumeral: false }
      : null
  }
  return answered.camp === null || answered.recalledAt !== null
    ? null
    : {
        heading: march.campHeading,
        value: copy.map.campStrength(answered.camp.tier, answered.camp.strength),
        isNumeral: false,
      }
}

function marksOf(live: LiveMarch, answered: AnsweredMarch): ReadonlyArray<number> {
  if (isFoundingOnTheWay(answered)) {
    return []
  }
  return live.arrivalSeconds === live.leavingSeconds
    ? [live.arrivalSeconds]
    : [live.arrivalSeconds, live.leavingSeconds]
}

function marchSlotStateOf(fief: LiveFief, recall: Recall, onRecalled: () => void): MarchSlotState {
  const live = fief.march
  const answered = fief.overview.march
  if (live === null || answered === null) {
    return { kind: 'idle', title: march.slot, invitation: march.idleSlot }
  }
  const countdown = marchCountdownOf(live, answered)
  return {
    kind: 'busy',
    title: march.busySlot,
    phase: marchPhaseLineOf(live, answered),
    detail: detailLineOf(live, answered),
    countdown: {
      words: countdown.words,
      time: formatFinish(countdown.remainingSeconds, fief.at),
    },
    loot: lootOf(answered),
    elapsedSeconds: live.elapsedSeconds,
    totalSeconds: live.totalSeconds,
    marks: marksOf(live, answered),
    recall: live.phase === 'returning' ? null : recallOf(answered, recall, onRecalled),
  }
}

function unitCardElementOf(
  card: UnitCardContent,
  entry: string,
  recruit: Recruit,
  onEntryChange: (entry: string) => void,
  onRecruit: () => void,
): ReactElement {
  switch (card.kind) {
    case 'locked':
      return <LockedUnitCard {...card} titleElement="h4" />
    case 'open':
      return (
        <UnitCard
          {...card}
          entry={entry}
          titleElement="h4"
          isWaiting={recruit.isWaiting}
          onEntryChange={onEntryChange}
          onRecruit={onRecruit}
        />
      )
    default: {
      const unreachable: never = card
      return unreachable
    }
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
  const card = unitCardOf(unit, entry, fief)
  return (
    <li aria-label={copy.names.units[unit].plural} className="flex flex-col">
      {unitCardElementOf(card, entry, recruit, setEntry, onRecruit)}
    </li>
  )
}

export function ArmySection({
  fief,
  recruit,
  recall,
  hint,
}: {
  readonly fief: LiveFief
  readonly recruit: Recruit
  readonly recall: Recall
  readonly hint: HintProps | undefined
}): ReactElement {
  const headingId = useId()
  const heading = useFocusTarget<HTMLHeadingElement>()
  const recruitTitle = useFocusTarget<HTMLSpanElement>()
  const marchTitle = useFocusTarget<HTMLSpanElement>()
  return (
    <section
      id={sectionAnchors.barracks}
      aria-labelledby={headingId}
      className="flex flex-col gap-3 md:scroll-mt-status"
    >
      <SeasonSectionHeading
        id={headingId}
        headingRef={heading.ref}
        title={army.section}
        mark={seasonSectionMarkOf(fief.overview.season, 'train', army.seasonMark)}
      />
      {hint !== undefined && <Hint {...hintFocusingAfterDismiss(hint, heading.focus)} />}
      <div className="grid items-start gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-3">
          <RecruitSlot
            state={recruitSlotStateOf(fief, recruit, recruitTitle.focus)}
            titleRef={recruitTitle.ref}
          />
          <MarchSlot
            state={marchSlotStateOf(fief, recall, marchTitle.focus)}
            titleRef={marchTitle.ref}
          />
        </div>
        <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2 lg:col-span-2">
          {UnitKindSchema.options.map((unit) => (
            <UnitItem key={unit} unit={unit} fief={fief} recruit={recruit} />
          ))}
        </ul>
      </div>
      {recruit.refused !== undefined && (
        <FormAlert message={recruitRefusalLineOf(recruit.refused, fief)} />
      )}
      {recall.refusal !== undefined && <FormAlert message={copy.refusals[recall.refusal]} />}
    </section>
  )
}
