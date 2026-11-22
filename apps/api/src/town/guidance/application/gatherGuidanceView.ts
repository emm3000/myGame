import {
  type DomainError,
  type Instant,
  type MemoryTerms,
  type NextGoal,
  type NextStep,
  nextDueAtOf,
  nextGoalOf,
  nextStepOf,
  ok,
  placedOutBandsOf,
  type ReleasedLesson,
  type Result,
  type TipKind,
  type TownCatalog,
  tipOf,
} from '@mygame/domain'
import type { LessonLibrary } from '#content/application/ports/LessonLibrary'
import type { TownReading } from '../../application/TownReading'

type StepWithGoal = Extract<NextStep, { readonly kind: 'lessonRunning' | 'caughtUp' }>

export type GuidedStep =
  | Exclude<NextStep, StepWithGoal>
  | (StepWithGoal & { readonly goal: NextGoal | null })

export type GuidanceView = {
  readonly nextStep: GuidedStep
  readonly tip: TipKind | null
  readonly nextDueAt: Instant | null
}

const goalOf = (
  reading: TownReading,
  catalog: TownCatalog,
): Result<NextGoal | null, DomainError> => {
  if (reading.guidanceDismissedAt !== undefined) {
    return ok(null)
  }
  const goal = nextGoalOf(reading.town, reading.at, catalog)
  return goal.ok ? ok(goal.value ?? null) : goal
}

const guidedStepOf = (
  reading: TownReading,
  released: ReadonlyArray<ReleasedLesson>,
  catalog: TownCatalog,
  lessons: LessonLibrary,
  memoryTerms: MemoryTerms,
): Result<GuidedStep, DomainError> => {
  const step = nextStepOf(
    { ...reading, released, placedOutBands: placedOutBandsOf(reading.placementScores) },
    { lessons: lessons.lessons(), texts: lessons.texts(), bands: lessons, memoryTerms, catalog },
  )
  if (!step.ok) {
    return step
  }
  switch (step.value.kind) {
    case 'reviews':
    case 'holdoutCheck':
    case 'releasedLesson':
    case 'lessonToStudy':
      return ok(step.value)
    case 'lessonRunning':
    case 'caughtUp': {
      const goal = goalOf(reading, catalog)
      return goal.ok ? ok({ ...step.value, goal: goal.value }) : goal
    }
  }
}

export const gatherGuidanceView = (
  reading: TownReading,
  released: ReadonlyArray<ReleasedLesson>,
  catalog: TownCatalog,
  lessons: LessonLibrary,
  memoryTerms: MemoryTerms,
): Result<GuidanceView, DomainError> => {
  const nextStep = guidedStepOf(reading, released, catalog, lessons, memoryTerms)
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
  return ok({ nextStep: nextStep.value, tip: tip.value ?? null, nextDueAt: nextDueAt.value })
}
