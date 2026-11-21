import type { PlayerCopy } from '../copy/PlayerCopy'
import type { Label } from '../design-system/Label'
import { placeNameOf } from './placeNameOf'
import { missingOf, shortfallLineOf } from './shortfallLineOf'
import type { TownGoal } from './TownGoal'

export interface GoalLines {
  readonly line: Label
  readonly states: ReadonlyArray<Label>
}

type Missing = Extract<TownGoal, { readonly state: 'pending' }>['missing']

function missingLinesOf(copy: PlayerCopy, { resources, people }: Missing): ReadonlyArray<Label> {
  const shortfalls = missingOf(resources)
  const lines = [
    ...(shortfalls.length === 0
      ? []
      : [copy.chrome((catalog) => shortfallLineOf(catalog, shortfalls))]),
    ...(people > 0 ? [copy.chrome((catalog) => catalog.townGoalPeople({ count: people }))] : []),
  ]
  return lines.length === 0 ? [copy.chrome((catalog) => catalog.townGoalReady())] : lines
}

export function goalLinesOf(copy: PlayerCopy, goal: TownGoal): GoalLines {
  const line = copy.chrome((catalog) =>
    catalog.townGoalLine({
      position: goal.position,
      count: goal.count,
      place: placeNameOf(catalog, goal.building),
      level: goal.level,
    }),
  )
  return {
    line,
    states:
      goal.state === 'underway'
        ? [copy.chrome((catalog) => catalog.townInWork())]
        : missingLinesOf(copy, goal.missing),
  }
}
