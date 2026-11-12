import { townGoalLine, townGoalPeople, townGoalReady, townInWork } from '@mygame/catalog'
import { placeNameOf } from './placeNameOf'
import { missingLineOf } from './shortfallLineOf'
import type { TownGoal } from './TownGoal'

export interface GoalLines {
  readonly line: string
  readonly states: ReadonlyArray<string>
}

type Missing = Extract<TownGoal, { readonly state: 'pending' }>['missing']

function missingLinesOf({ resources, people }: Missing): ReadonlyArray<string> {
  const lines = [
    missingLineOf(resources),
    people > 0 ? townGoalPeople({ count: people }) : undefined,
  ].filter((line) => line !== undefined)
  return lines.length === 0 ? [townGoalReady()] : lines
}

export function goalLinesOf(goal: TownGoal): GoalLines {
  const line = townGoalLine({
    position: goal.position,
    count: goal.count,
    place: placeNameOf(goal.building),
    level: goal.level,
  })
  return {
    line,
    states: goal.state === 'underway' ? [townInWork()] : missingLinesOf(goal.missing),
  }
}
