import { ResourceKindSchema } from '@mygame/contracts/town'
import type { GateContent } from './GateContent'

const firstResource = 'food'

const skillRatePercent = 5

export const checkSkill = ({ curriculum }: GateContent): ReadonlyArray<string> => {
  const { cycle, ratePercent } = curriculum.skill
  const timesNamed = (kind: string): number => cycle.filter((named) => named === kind).length
  return [
    ...ResourceKindSchema.options
      .filter((kind) => timesNamed(kind) === 0)
      .map((kind) => `skill cycle misses ${kind}`),
    ...ResourceKindSchema.options
      .filter((kind) => timesNamed(kind) > 1)
      .map((kind) => `skill cycle names ${kind} more than once`),
    ...(cycle[0] === firstResource
      ? []
      : [`skill cycle starts at ${cycle[0]}, not ${firstResource}`]),
    ...(ratePercent === skillRatePercent
      ? []
      : [`skill rate is ${ratePercent} %, not ${skillRatePercent} %`]),
  ]
}
