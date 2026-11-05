import {
  goalDismiss,
  goalMissingPeasants,
  goalPosition,
  goalReady,
  goalTitle,
  goalUnderway,
  refusalQueueFull,
} from '@mygame/catalog'
import type { FiefOverview } from '@mygame/contracts'
import type { GoalCardProps, GoalStateLine } from '../design-system/GoalCard'
import { refusalLineOf } from '../refusals/refusalLineOf'
import { goalLineOf } from './goalLineOf'
import { isQueueFull } from './isQueueFull'
import { tooExpensiveLineOf } from './tooExpensiveLineOf'
import type { GuidanceDismissal } from './useGuidanceDismissal'

type Goal = NonNullable<FiefOverview['goal']>

const pendingLinesOf = (
  missing: Extract<Goal, { readonly state: 'pending' }>['missing'],
  overview: FiefOverview,
): ReadonlyArray<GoalStateLine> => {
  const lines: Array<GoalStateLine> = []
  if (missing.resources.length > 0) {
    lines.push({ text: tooExpensiveLineOf(missing.resources), tone: 'short' })
  }
  if (missing.peasants > 0) {
    lines.push({ text: goalMissingPeasants({ count: missing.peasants }), tone: 'short' })
  }
  if (lines.length > 0) {
    return lines
  }
  if (isQueueFull(overview)) {
    return [{ text: refusalQueueFull(), tone: 'short' }]
  }
  return [{ text: goalReady(), tone: 'ready' }]
}

const stateLinesOf = (goal: Goal, overview: FiefOverview): ReadonlyArray<GoalStateLine> =>
  goal.state === 'underway'
    ? [{ text: goalUnderway(), tone: 'underway' }]
    : pendingLinesOf(goal.missing, overview)

export function goalCardOf(
  overview: FiefOverview,
  dismissal: GuidanceDismissal,
  onDismissed: () => void,
): GoalCardProps | undefined {
  const { goal } = overview
  if (goal === null || dismissal.isDismissed) {
    return undefined
  }
  return {
    title: goalTitle(),
    position: goalPosition({ position: goal.position, count: goal.count }),
    goal: goalLineOf(goal.building, goal.level),
    stateLines: stateLinesOf(goal, overview),
    dismissLabel: goalDismiss(),
    isWaiting: dismissal.isWaiting,
    refusal: dismissal.refusal === undefined ? undefined : refusalLineOf(dismissal.refusal),
    onDismiss: () => dismissal.dismiss(onDismissed),
  }
}
