import type { FiefEvent, FiefOverview } from '@mygame/contracts'
import { chronicleRowOf } from '../chronicle/chronicleRowOf'
import { isFoundingOnTheWay, marchEndOf } from '../fief/liveFief'

export interface FinishNotice {
  readonly tag: string
  readonly title: string
  readonly body: string
}

type FinishOf = (previous: FiefOverview, next: FiefOverview) => ReadonlyArray<FiefEvent>

const hasPassed = (instant: string, next: FiefOverview): boolean =>
  Date.parse(instant) <= Date.parse(next.readAt)

const upgradesFinished: FinishOf = (previous, next) => {
  const started = previous.slot.kind === 'busy' ? [previous.slot] : []
  return [...started, ...previous.queue.entries]
    .filter(
      (upgrade) =>
        hasPassed(upgrade.finishesAt, next) &&
        next.buildings[upgrade.building].level >= upgrade.targetLevel,
    )
    .map((upgrade) => ({
      kind: 'upgradeFinished',
      building: upgrade.building,
      level: upgrade.targetLevel,
      occurredAt: upgrade.finishesAt,
    }))
}

const studiesFinished: FinishOf = (previous, next) => {
  const study = previous.study
  if (
    study.kind === 'idle' ||
    !hasPassed(study.finishesAt, next) ||
    next.arts[study.art].level < study.targetLevel
  ) {
    return []
  }
  return [
    { kind: 'artLearned', art: study.art, level: study.targetLevel, occurredAt: study.finishesAt },
  ]
}

const leviesFinished: FinishOf = (previous, next) => {
  const order = previous.recruitOrder
  if (
    order === null ||
    !hasPassed(order.endsAt, next) ||
    next.recruitOrder?.startedAt === order.startedAt
  ) {
    return []
  }
  return [
    { kind: 'recruitsDelivered', unit: order.unit, count: order.count, occurredAt: order.endsAt },
  ]
}

const marchesFinished: FinishOf = (previous, next) => {
  const march = previous.march
  if (
    march === null ||
    !hasPassed(marchEndOf(march), next) ||
    next.march?.departedAt === march.departedAt
  ) {
    return []
  }
  const { province, plot } = march
  if (march.order === 'found' && isFoundingOnTheWay(march)) {
    return [{ kind: 'fiefFounded', province, plot, name: march.name, occurredAt: march.arrivesAt }]
  }
  return [
    {
      kind: 'marchReturned',
      province,
      plot,
      units: march.units,
      loot: march.loot,
      occurredAt: march.returnsAt,
      recalled: march.recalledAt !== null,
    },
  ]
}

const cargoesArrived: FinishOf = (previous, next) => {
  const cargo = previous.incomingCargo
  if (
    cargo === null ||
    !hasPassed(cargo.arrivesAt, next) ||
    next.incomingCargo?.arrivesAt === cargo.arrivesAt
  ) {
    return []
  }
  return [
    {
      kind: 'transportArrived',
      province: cargo.from.province,
      plot: cargo.from.plot,
      name: cargo.from.name,
      cargo: cargo.cargo,
      occurredAt: cargo.arrivesAt,
    },
  ]
}

const finishes: ReadonlyArray<FinishOf> = [
  upgradesFinished,
  studiesFinished,
  leviesFinished,
  marchesFinished,
  cargoesArrived,
]

export function finishNoticesOf(
  previous: FiefOverview,
  next: FiefOverview,
): ReadonlyArray<FinishNotice> {
  const readAt = new Date(next.readAt)
  return finishes
    .flatMap((finish) => finish(previous, next))
    .map((event) => {
      const row = chronicleRowOf(event, readAt)
      return {
        tag: `${next.id}-${row.key}`,
        title: next.name,
        body: `${row.heading} ${row.subject}`,
      }
    })
}
