import type { ResourceCost } from './shortfallsOf'

export function costTimes(cost: ResourceCost, count: number): ResourceCost {
  return {
    wood: cost.wood * count,
    stone: cost.stone * count,
    iron: cost.iron * count,
    gold: cost.gold * count,
    food: cost.food * count,
  }
}
