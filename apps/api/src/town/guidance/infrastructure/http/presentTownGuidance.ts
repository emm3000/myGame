import type { TownOverview } from '@mygame/contracts'
import type { NextGoal } from '@mygame/domain'
import { isoOf } from '#platform/infrastructure/http/isoOf'
import type { GuidanceView, GuidedStep } from '../../application/gatherGuidanceView'

type Goal = Extract<TownOverview['nextStep'], { kind: 'caughtUp' }>['goal']

const presentGoal = (goal: NextGoal | null): Goal => {
  if (goal === null) {
    return null
  }
  const { position, count, building, level } = goal
  return goal.state === 'underway'
    ? { position, count, building, level, state: 'underway' }
    : {
        position,
        count,
        building,
        level,
        state: 'pending',
        missing: { resources: { ...goal.missing.resources }, people: goal.missing.people },
      }
}

const presentNextStep = (step: GuidedStep): TownOverview['nextStep'] => {
  switch (step.kind) {
    case 'reviews':
      return { ...step, readFirst: [...step.readFirst] }
    case 'holdoutCheck':
    case 'releasedLesson':
    case 'lessonToStudy':
      return step
    case 'lessonRunning':
    case 'caughtUp':
      return { ...step, goal: presentGoal(step.goal) }
  }
}

export const presentTownGuidance = ({
  nextStep,
  tip,
  nextDueAt,
}: GuidanceView): Pick<TownOverview, 'nextStep' | 'tip' | 'nextDueAt'> => ({
  nextStep: presentNextStep(nextStep),
  tip,
  nextDueAt: nextDueAt === null ? null : isoOf(nextDueAt),
})
