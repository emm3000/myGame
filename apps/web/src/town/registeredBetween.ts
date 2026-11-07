import {
  type BuildingKind,
  BuildingKindSchema,
  type ResourceKind,
  type TownOverview,
} from '@mygame/contracts/town'

export interface RaisedPlace {
  readonly place: BuildingKind
  readonly levelBefore: number
  readonly level: number
}

export interface RetainedRise {
  readonly countBefore: number
  readonly count: number
  readonly total: number
}

export interface EarnedRate {
  readonly resource: ResourceKind
  readonly ratePerHourBefore: number
  readonly ratePerHourAfter: number
}

export interface Registered {
  readonly places: ReadonlyArray<RaisedPlace>
  readonly retainedWords: RetainedRise | undefined
  readonly rates: ReadonlyArray<EarnedRate>
}

export function levelBeforeOf(
  raised: ReadonlyArray<RaisedPlace>,
  place: BuildingKind,
  level: number,
): number {
  return raised.find((entry) => entry.place === place)?.levelBefore ?? level
}

export const nothingRegistered: Registered = { places: [], retainedWords: undefined, rates: [] }

const raisedPlacesBetween = (
  previous: TownOverview,
  next: TownOverview,
): ReadonlyArray<RaisedPlace> =>
  BuildingKindSchema.options
    .map((place) => ({
      place,
      levelBefore: previous.buildings[place].level,
      level: next.buildings[place].level,
    }))
    .filter(({ levelBefore, level }) => level > levelBefore)

function retainedRiseBetween(previous: TownOverview, next: TownOverview): RetainedRise | undefined {
  const before = previous.learning.retainedWords
  const after = next.learning.retainedWords
  if (before === null || after === null || before.total !== after.total) {
    return undefined
  }
  return after.count > before.count
    ? { countBefore: before.count, count: after.count, total: after.total }
    : undefined
}

function earnedRatesBetween(previous: TownOverview, next: TownOverview): ReadonlyArray<EarnedRate> {
  const held = new Set(previous.skills.map(({ lessonId }) => lessonId))
  const resources = new Set(
    next.skills.filter(({ lessonId }) => !held.has(lessonId)).map(({ resource }) => resource),
  )
  return [...resources].map((resource) => ({
    resource,
    ratePerHourBefore: previous.stocks[resource].ratePerHour,
    ratePerHourAfter: next.stocks[resource].ratePerHour,
  }))
}

export function registeredBetween(previous: TownOverview, next: TownOverview): Registered {
  return {
    places: raisedPlacesBetween(previous, next),
    retainedWords: retainedRiseBetween(previous, next),
    rates: earnedRatesBetween(previous, next),
  }
}
