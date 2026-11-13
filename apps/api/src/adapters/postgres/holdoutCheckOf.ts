import {
  HOLDOUT_CHECK_WEEKS,
  type HoldoutCheck,
  type HoldoutCheckWeek,
  Instant,
} from '@mygame/domain'
import type { holdoutChecks, holdoutCheckWords } from './schema'

export type StoredHoldoutCheck = Omit<typeof holdoutChecks.$inferSelect, 'playerId' | 'band'>

export type StoredHoldoutCheckWord = Pick<
  typeof holdoutCheckWords.$inferSelect,
  'wordId' | 'isHeldOut'
>

const instantOf = (date: Date): Instant => Instant.fromEpochMilliseconds(date.getTime())

const weekOf = (week: number): HoldoutCheckWeek => {
  const known = HOLDOUT_CHECK_WEEKS.find((checkWeek) => checkWeek === week)
  if (known === undefined) {
    throw new Error(`Holdout check week ${week} is unknown`)
  }
  return known
}

const required = <T>(value: T | null, column: string): T => {
  if (value === null) {
    throw new Error(`Holdout check column ${column} is null`)
  }
  return value
}

export const holdoutCheckOf = (
  row: StoredHoldoutCheck,
  asked: ReadonlyArray<StoredHoldoutCheckWord>,
): HoldoutCheck => {
  const week = weekOf(row.week)
  if (row.kind === 'skipped') {
    return { kind: 'skipped', week, skippedAt: instantOf(required(row.closedAt, 'closed_at')) }
  }
  const begun = {
    week,
    begunAt: instantOf(required(row.begunAt, 'begun_at')),
    sample: {
      wordIds: asked.map(({ wordId }) => wordId),
      heldOutWordIds: asked.filter(({ isHeldOut }) => isHeldOut).map(({ wordId }) => wordId),
    },
  }
  if (row.kind === 'begun') {
    return { kind: 'begun', ...begun }
  }
  return {
    kind: 'taken',
    ...begun,
    heldOutScore: required(row.heldOutScore, 'held_out_score'),
    practisedScore: required(row.practisedScore, 'practised_score'),
    takenAt: instantOf(required(row.closedAt, 'closed_at')),
  }
}
