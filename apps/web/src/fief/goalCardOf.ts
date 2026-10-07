import type { FiefOverview } from '@mygame/contracts'
import { copy } from '../copy'
import type { GoalCardProps, GoalStateLine } from '../design-system/GoalCard'
import { isQueueFull } from './isQueueFull'
import type { GuidanceDismissal } from './useGuidanceDismissal'

type Goal = NonNullable<FiefOverview['goal']>

const pendingLinesOf = (
  missing: Extract<Goal, { readonly state: 'pending' }>['missing'],
  overview: FiefOverview,
): ReadonlyArray<GoalStateLine> => {
  const lines: Array<GoalStateLine> = []
  if (missing.resources.length > 0) {
    lines.push({ text: copy.fief.tooExpensive(missing.resources), tone: 'short' })
  }
  if (missing.peasants > 0) {
    lines.push({ text: copy.goal.missingPeasants(missing.peasants), tone: 'short' })
  }
  if (lines.length > 0) {
    return lines
  }
  if (isQueueFull(overview)) {
    return [{ text: copy.refusals.QueueFull, tone: 'short' }]
  }
  return [{ text: copy.goal.ready, tone: 'ready' }]
}

const stateLinesOf = (goal: Goal, overview: FiefOverview): ReadonlyArray<GoalStateLine> =>
  goal.state === 'underway'
    ? [{ text: copy.goal.underway, tone: 'underway' }]
    : pendingLinesOf(goal.missing, overview)

export function goalCardOf(
  overview: FiefOverview,
  dismissal: GuidanceDismissal,
): GoalCardProps | undefined {
  const { goal } = overview
  if (goal === null || dismissal.isDismissed) {
    return undefined
  }
  return {
    title: copy.goal.title,
    position: copy.goal.position(goal.position, goal.count),
    goal: copy.goal.line(goal.building, goal.level),
    stateLines: stateLinesOf(goal, overview),
    dismissLabel: copy.goal.dismiss,
    isWaiting: dismissal.isWaiting,
    refusal: dismissal.refusal === undefined ? undefined : copy.refusals[dismissal.refusal],
    onDismiss: dismissal.dismiss,
  }
}
