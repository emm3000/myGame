import { PlacementBandSchema, type TownOverview } from '@mygame/contracts'
import {
  type DomainError,
  type MemoryTerms,
  nextDueAtOf,
  nextGoalOf,
  nextStepOf,
  ok,
  placedOutBandsOf,
  type ReleasedLesson,
  type Result,
  type TownCatalog,
  tipOf,
} from '@mygame/domain'
import type { LessonLibrary } from '#content/application/ports/LessonLibrary'
import { isoOf } from '#platform/infrastructure/http/isoOf'
import type { TownReading } from '../../../application/TownReading'

type Goal = Extract<TownOverview['nextStep'], { kind: 'caughtUp' }>['goal']

const goalOf = (reading: TownReading, catalog: TownCatalog): Result<Goal, DomainError> => {
  if (reading.guidanceDismissedAt !== undefined) {
    return ok(null)
  }
  const goal = nextGoalOf(reading.town, reading.at, catalog)
  if (!goal.ok) {
    return goal
  }
  const next = goal.value
  if (next === undefined) {
    return ok(null)
  }
  const { position, count, building, level } = next
  return ok(
    next.state === 'underway'
      ? { position, count, building, level, state: 'underway' }
      : {
          position,
          count,
          building,
          level,
          state: 'pending',
          missing: { resources: { ...next.missing.resources }, people: next.missing.people },
        },
  )
}

const nextStepOfReading = (
  reading: TownReading,
  released: ReadonlyArray<ReleasedLesson>,
  catalog: TownCatalog,
  lessons: LessonLibrary,
  memoryTerms: MemoryTerms,
): Result<TownOverview['nextStep'], DomainError> => {
  const step = nextStepOf(
    { ...reading, released, placedOutBands: placedOutBandsOf(reading.placementScores) },
    { lessons: lessons.lessons(), texts: lessons.texts(), bands: lessons, memoryTerms, catalog },
  )
  if (!step.ok) {
    return step
  }
  switch (step.value.kind) {
    case 'reviews':
      return ok({ ...step.value, readFirst: [...step.value.readFirst] })
    case 'holdoutCheck':
    case 'releasedLesson':
      return ok({ ...step.value, band: PlacementBandSchema.parse(step.value.band) })
    case 'lessonToStudy':
      return ok(step.value)
    case 'lessonRunning':
    case 'caughtUp': {
      const goal = goalOf(reading, catalog)
      return goal.ok ? ok({ ...step.value, goal: goal.value }) : goal
    }
  }
}

export const presentTownGuidance = (
  reading: TownReading,
  released: ReadonlyArray<ReleasedLesson>,
  catalog: TownCatalog,
  lessons: LessonLibrary,
  memoryTerms: MemoryTerms,
): Result<Pick<TownOverview, 'nextStep' | 'tip' | 'nextDueAt'>, DomainError> => {
  const nextStep = nextStepOfReading(reading, released, catalog, lessons, memoryTerms)
  if (!nextStep.ok) {
    return nextStep
  }
  const tip = tipOf(reading, catalog)
  if (!tip.ok) {
    return tip
  }
  const nextDueAt = nextDueAtOf(reading.cards, reading.at, memoryTerms)
  if (!nextDueAt.ok) {
    return nextDueAt
  }
  return ok({
    nextStep: nextStep.value,
    tip: tip.value ?? null,
    nextDueAt: nextDueAt.value === null ? null : isoOf(nextDueAt.value),
  })
}
