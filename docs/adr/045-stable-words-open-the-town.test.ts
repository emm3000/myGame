import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { JsonLessonCatalog } from '../../apps/api/src/adapters/json/JsonLessonCatalog'
import { JsonTownCatalog } from '../../apps/api/src/adapters/json/JsonTownCatalog'
import {
  type BuildingKind,
  type BuildingLevel,
  buildingKinds,
  cardsInLearningOf,
  defaultMemoryTerms,
  deriveLessonDurationSeconds,
  derivePeople,
  deriveResourceRates,
  deriveStorageCapacity,
  dueInstantOf,
  foundingLevels,
  type HeldCard,
  Instant,
  isWordRetained,
  MemoryCard,
  type MemoryRating,
  noHires,
  type ResourceKind,
  resourceKinds,
  reviewMemoryCard,
  type TownSkill,
} from '../../packages/domain/src/index'

type Plan = 'homesOnly' | 'balanced'
type Learner = 'onTime' | 'daily' | 'everyThirdDay' | 'none'
type SkillRule =
  | 'cycle'
  | 'none'
  | 'moneyOnly'
  | 'cycleWithoutMoney'
  | 'everyLessonMoney'
  | 'everyLessonMoneyAndCycleWithoutMoney'
type NeedCount = 'stable' | 'retained' | 'stableThenRetained'
type ReviewHabit = 'every' | 'skipsOnceStable' | 'missesThreeRecallsInTen'
type Terms = {
  readonly plan: Plan
  readonly needCount: NeedCount
  readonly reviewHabit: ReviewHabit
  readonly learner: Learner
  readonly wordsNeeded: (level: number) => number
  readonly skillRule: SkillRule
  readonly moneyPerStableWordPerHour: number
  readonly days: number
}
type Work = { readonly building: BuildingKind; readonly level: number }
type StudiedCard = HeldCard & { readonly position: number; readonly dueAt: number }
type Run = {
  at: number
  levels: Record<BuildingKind, number>
  stocks: Record<ResourceKind, number>
  slot: { readonly work: Work; readonly finishesAt: number } | null
  waiting: Array<Work>
  lessonSlot: { readonly position: number; readonly finishesAt: number } | null
  nextPosition: number
  cards: Array<StudiedCard>
  skills: Array<TownSkill>
  earned: Set<number>
  finishedDay: Map<string, number>
  refusedForWordsDay: Map<string, number>
  stableByMinute: Array<number>
  retainedByMinute: Array<number>
  stableDayOfLesson: Map<number, number>
  recallsAnswered: number
}
type Result<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: unknown }

const contentPath = (path: string): string =>
  fileURLToPath(new URL(`../../apps/api/content/${path}`, import.meta.url))
const catalog = JsonTownCatalog.fromDirectory(contentPath('town'))
const curriculum = JSON.parse(readFileSync(contentPath('lessons/curriculum.json'), 'utf8'))
const lessonIds: ReadonlyArray<string> = curriculum.lessonIds
const cycle: ReadonlyArray<ResourceKind> = curriculum.skill.cycle
const lessonFiles = lessonIds.map((id) =>
  JSON.parse(readFileSync(contentPath(`lessons/${id}.json`), 'utf8')),
)

const START = Date.parse('2026-03-02T08:00:00Z')
const MINUTE = 60_000
const HOUR = 3_600_000
const DAY = 86_400_000
const SESSION_OFFSET = 12 * HOUR
const SESSION_LENGTH = 30 * MINUTE
const WAITING_LIST_CAP = catalog.townSettings().waitingListCap
const TOP_LEVEL = 10

const unwrapped = <T>(result: Result<T>): T => {
  if (!result.ok) {
    throw new Error(JSON.stringify(result.error))
  }
  return result.value
}

const levelOf = (building: BuildingKind, level: number): BuildingLevel => {
  const found = catalog.levelOf(building, level)
  if (found === undefined) {
    throw new Error(`no ${building} ${level}`)
  }
  return found
}

const dayOf = (instant: number): number => (instant - START) / DAY

const isInSession = (learner: Learner, at: number): boolean => {
  const period = learner === 'everyThirdDay' ? 3 * DAY : DAY
  const intoPeriod = (at - START) % period
  return intoPeriod >= SESSION_OFFSET && intoPeriod < SESSION_OFFSET + SESSION_LENGTH
}

const isPlaying = (learner: Learner, at: number): boolean =>
  learner === 'onTime' || (learner !== 'none' && isInSession(learner, at))

const stableWordsOf = (run: Run): number => run.cards.length - cardsInLearningOf(run.cards)

const retainedWordsOf = (run: Run): number => run.cards.filter(isWordRetained).length

const LAST_STABLE_LEVEL = 6

const countedWordsOf = (run: Run, level: number, needCount: NeedCount): number => {
  if (
    needCount === 'stable' ||
    (needCount === 'stableThenRetained' && level <= LAST_STABLE_LEVEL)
  ) {
    return stableWordsOf(run)
  }
  return retainedWordsOf(run)
}

const isAnswered = (studied: StudiedCard, habit: ReviewHabit): boolean => {
  const { stability } = studied.card.stored
  return habit !== 'skipsOnceStable' || stability === null || stability < 7
}

const ratingAnswered = (run: Run, studied: StudiedCard, habit: ReviewHabit): MemoryRating => {
  if (habit !== 'missesThreeRecallsInTen' || studied.card.stored.state === 'learning') {
    return 'good'
  }
  run.recallsAnswered += 1
  return run.recallsAnswered % 10 < 3 ? 'again' : 'good'
}

const projectedLevelsOf = (run: Run): Record<BuildingKind, number> => {
  const projected = { ...run.levels }
  const queued = run.slot === null ? run.waiting : [run.slot.work, ...run.waiting]
  for (const work of queued) {
    projected[work.building] = work.level
  }
  return projected
}

const skillsEarnedBy = (rule: SkillRule, position: number, at: Instant): Array<TownSkill> => {
  const lessonId = lessonIds[position] ?? ''
  const cycled = cycle[position % cycle.length] ?? 'food'
  const skill = (resource: ResourceKind): TownSkill => ({
    lessonId,
    resource,
    ratePercent: 5,
    earnedAt: at,
  })
  switch (rule) {
    case 'cycle':
      return [skill(cycled)]
    case 'none':
      return []
    case 'moneyOnly':
      return cycled === 'money' ? [skill(cycled)] : []
    case 'cycleWithoutMoney':
      return cycled === 'money' ? [] : [skill(cycled)]
    case 'everyLessonMoney':
      return [skill('money')]
    case 'everyLessonMoneyAndCycleWithoutMoney':
      return cycled === 'money' ? [skill('money')] : [skill('money'), skill(cycled)]
    default: {
      const unknownRule: never = rule
      return unknownRule
    }
  }
}

const answerDueCards = (run: Run, habit: ReviewHabit): void => {
  const at = Instant.fromEpochMilliseconds(run.at)
  run.cards = run.cards.map((studied) => {
    if (studied.dueAt > run.at || !isAnswered(studied, habit)) {
      return studied
    }
    const rating = ratingAnswered(run, studied, habit)
    const card = unwrapped(reviewMemoryCard(studied.card, rating, at, defaultMemoryTerms))
    const dueAt = unwrapped(dueInstantOf(card, defaultMemoryTerms)).epochMilliseconds
    if ((card.stored.stability ?? 0) >= 7 && !run.stableDayOfLesson.has(studied.position)) {
      run.stableDayOfLesson.set(studied.position, dayOf(run.at))
    }
    return { ...studied, card, dueAt }
  })
}

const earnRetainedLessons = (run: Run, rule: SkillRule): void => {
  for (let position = 0; position < run.nextPosition; position += 1) {
    const held = run.cards.filter((studied) => studied.position === position)
    if (run.earned.has(position) || held.length === 0 || !held.every(isWordRetained)) {
      continue
    }
    run.earned.add(position)
    run.skills.push(...skillsEarnedBy(rule, position, Instant.fromEpochMilliseconds(run.at)))
    run.finishedDay.set(`skill ${position + 1}`, dayOf(run.at))
  }
}

const startNextLesson = (run: Run): void => {
  const file = lessonFiles[run.nextPosition]
  const school = levelOf('school', run.levels.school)
  if (run.lessonSlot !== null || file === undefined || school.building !== 'school') {
    return
  }
  if (cardsInLearningOf(run.cards) + file.wordIds.length > school.learningCap) {
    return
  }
  const seconds = deriveLessonDurationSeconds(file.durationSeconds, school.lessonPercent, 100)
  run.lessonSlot = { position: run.nextPosition, finishesAt: run.at + seconds * 1_000 }
  run.finishedDay.set(`lesson ${run.nextPosition + 1}`, dayOf(run.at))
  run.nextPosition += 1
}

const settleLesson = (run: Run): void => {
  const slot = run.lessonSlot
  if (slot === null || slot.finishesAt > run.at) {
    return
  }
  const enteredAt = Instant.fromEpochMilliseconds(slot.finishesAt)
  const wordIds: ReadonlyArray<string> = lessonFiles[slot.position]?.wordIds ?? []
  for (const wordId of wordIds) {
    const card = MemoryCard.entered(enteredAt)
    run.cards.push({ wordId, card, position: slot.position, dueAt: slot.finishesAt })
  }
  run.lessonSlot = null
}

const settleWork = (run: Run): void => {
  while (run.slot !== null && run.slot.finishesAt <= run.at) {
    const { work, finishesAt } = run.slot
    run.levels = { ...run.levels, [work.building]: work.level }
    run.finishedDay.set(`${work.building} ${work.level}`, dayOf(finishesAt))
    const next = run.waiting.shift()
    run.slot =
      next === undefined
        ? null
        : {
            work: next,
            finishesAt: finishesAt + levelOf(next.building, next.level).durationSeconds * 1_000,
          }
  }
}

const nextOf = (projected: Record<BuildingKind, number>, building: BuildingKind): Work | null =>
  projected[building] >= TOP_LEVEL ? null : { building, level: projected[building] + 1 }

const prerequisiteOf = (run: Run, work: Work): Work | null => {
  const projected = projectedLevelsOf(run)
  const people = unwrapped(derivePeople(projected, noHires, catalog))
  const target = levelOf(work.building, work.level)
  const occupiedNow =
    projected[work.building] === 0 ? 0 : levelOf(work.building, projected[work.building]).people
  const capacity = unwrapped(deriveStorageCapacity(run.levels.storage, catalog))
  if (work.building !== 'homes' && target.people - occupiedNow > people.free) {
    return nextOf(projected, 'homes')
  }
  if (work.building !== 'storage' && resourceKinds.some((kind) => target.cost[kind] > capacity)) {
    return nextOf(projected, 'storage')
  }
  if (target.cost.power > run.stocks.power && projected.powerStation === 0) {
    return nextOf(projected, 'powerStation')
  }
  return work
}

const noteRefusedForWords = (run: Run, work: Work): void => {
  const key = `${work.building} ${work.level}`
  run.refusedForWordsDay.set(key, run.refusedForWordsDay.get(key) ?? dayOf(run.at))
}

const cheapestNextOf = (run: Run, terms: Terms): Work | null => {
  const projected = projectedLevelsOf(run)
  const moneyOf = (work: Work): number => levelOf(work.building, work.level).cost.money
  const candidates = buildingKinds
    .map((building) => nextOf(projected, building))
    .filter((work) => work !== null)
    .sort((first, second) => moneyOf(first) - moneyOf(second))
  const isOpen = (work: Work): boolean =>
    terms.wordsNeeded(work.level) <= countedWordsOf(run, work.level, terms.needCount)
  const [cheapest] = candidates
  if (cheapest !== undefined && !isOpen(cheapest)) {
    noteRefusedForWords(run, cheapest)
  }
  return candidates.find(isOpen) ?? null
}

const wantedWorkOf = (run: Run, terms: Terms): Work | null => {
  const projected = projectedLevelsOf(run)
  if (terms.plan === 'balanced') {
    const cheapest = cheapestNextOf(run, terms)
    return cheapest === null ? null : prerequisiteOf(run, cheapest)
  }
  if (projected.farm === 0) {
    return { building: 'farm', level: 1 }
  }
  if (projected.factory === 0) {
    return { building: 'factory', level: 1 }
  }
  const homes = nextOf(projected, 'homes')
  return homes === null ? null : prerequisiteOf(run, homes)
}

const isAdmitted = (run: Run, work: Work, terms: Terms): boolean => {
  const projected = projectedLevelsOf(run)
  const target = levelOf(work.building, work.level)
  const occupiedNow =
    projected[work.building] === 0 ? 0 : levelOf(work.building, projected[work.building]).people
  const people = unwrapped(derivePeople(projected, noHires, catalog))
  const isAffordable = resourceKinds.every((kind) => run.stocks[kind] >= target.cost[kind])
  if (!isAffordable || target.people - occupiedNow > people.free) {
    return false
  }
  if (countedWordsOf(run, work.level, terms.needCount) < terms.wordsNeeded(work.level)) {
    noteRefusedForWords(run, work)
    return false
  }
  return true
}

const queueWork = (run: Run, terms: Terms): void => {
  for (;;) {
    const queued = (run.slot === null ? 0 : 1) + run.waiting.length
    const work = wantedWorkOf(run, terms)
    if (queued > WAITING_LIST_CAP || work === null || !isAdmitted(run, work, terms)) {
      return
    }
    const target = levelOf(work.building, work.level)
    for (const kind of resourceKinds) {
      run.stocks[kind] -= target.cost[kind]
    }
    if (run.slot === null) {
      run.slot = { work, finishesAt: run.at + target.durationSeconds * 1_000 }
    } else {
      run.waiting.push(work)
    }
  }
}

const accrue = (run: Run, terms: Terms): void => {
  const at = Instant.fromEpochMilliseconds(run.at)
  const rates = unwrapped(deriveResourceRates(run.levels, 'fields', run.skills, catalog, at))
  const capacity = unwrapped(deriveStorageCapacity(run.levels.storage, catalog))
  const wordMoney = terms.moneyPerStableWordPerHour * stableWordsOf(run)
  for (const kind of resourceKinds) {
    const ratePerHour = rates[kind] + (kind === 'money' ? wordMoney : 0)
    const accrued = run.stocks[kind] + (ratePerHour * MINUTE) / HOUR
    run.stocks[kind] = Math.max(run.stocks[kind], Math.min(capacity, accrued))
  }
}

const learn = (run: Run, terms: Terms): void => {
  answerDueCards(run, terms.reviewHabit)
  earnRetainedLessons(run, terms.skillRule)
  startNextLesson(run)
}

const runOf = (terms: Terms): Run => {
  const run: Run = {
    at: START,
    levels: { ...foundingLevels },
    stocks: { ...catalog.townSettings().startingStocks },
    slot: null,
    waiting: [],
    lessonSlot: null,
    nextPosition: 0,
    cards: [],
    skills: [],
    earned: new Set(),
    finishedDay: new Map(),
    refusedForWordsDay: new Map(),
    stableByMinute: [],
    retainedByMinute: [],
    stableDayOfLesson: new Map(),
    recallsAnswered: 0,
  }
  for (; run.at < START + terms.days * DAY; run.at += MINUTE) {
    settleWork(run)
    settleLesson(run)
    const isActive = isPlaying(terms.learner, run.at)
    if (isActive) {
      learn(run, terms)
    }
    run.stableByMinute.push(stableWordsOf(run))
    run.retainedByMinute.push(retainedWordsOf(run))
    if (isActive || terms.learner === 'none') {
      queueWork(run, terms)
    }
    accrue(run, terms)
  }
  return run
}

const tenPerLevelFromThree = (level: number): number => (level < 3 ? 0 : 10 * (level - 2))
const noWordsNeeded = (): number => 0

const termsOf = (overrides: Partial<Terms>): Terms => ({
  plan: 'balanced',
  learner: 'onTime',
  wordsNeeded: noWordsNeeded,
  needCount: 'stable',
  reviewHabit: 'every',
  skillRule: 'cycle',
  moneyPerStableWordPerHour: 0,
  days: 90,
  ...overrides,
})

const rounded = (day: number | undefined): number | null =>
  day === undefined ? null : Math.round(day * 10) / 10

const homesDaysOf = (run: Run): ReadonlyArray<number | null> =>
  [2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => rounded(run.finishedDay.get(`homes ${level}`)))

const everyBuildingDaysOf = (run: Run): ReadonlyArray<number | null> =>
  [2, 3, 4, 5, 6, 7, 8, 9].map((level) => {
    const days = buildingKinds.map((building) => run.finishedDay.get(`${building} ${level}`))
    const reached = days.filter((day) => day !== undefined)
    return reached.length < days.length ? null : rounded(Math.max(...reached))
  })

const stableWordsOnDays = (run: Run, days: ReadonlyArray<number>): ReadonlyArray<number> =>
  days.map((day) => run.stableByMinute[Math.round(day * 1_440)] ?? 0)

const refusalsOf = (run: Run): ReadonlyArray<string> =>
  [...run.refusedForWordsDay].map(([work, day]) => `${work} at ${rounded(day)}`)

const decided = (overrides: Partial<Terms>): Terms =>
  termsOf({
    wordsNeeded: tenPerLevelFromThree,
    needCount: 'stableThenRetained',
    skillRule: 'everyLessonMoney',
    ...overrides,
  })

const stableOnly = (overrides: Partial<Terms>): Terms =>
  decided({ needCount: 'stable', ...overrides })

const retainedOnly = (overrides: Partial<Terms>): Terms =>
  decided({ needCount: 'retained', ...overrides })

const firstDayRetaining = (run: Run, words: number): number | null => {
  const minute = run.retainedByMinute.findIndex((retained) => retained >= words)
  return minute < 0 ? null : rounded(minute / 1_440)
}

const poolDaysOf = (run: Run, resource: ResourceKind): ReadonlyArray<number | null> => {
  const pool = lessonIds
    .map((_, position) => position)
    .filter((position) => cycle[position % cycle.length] === resource)
  return [10, 20, 30].map((words) => {
    const position = pool[words / 5 - 1]
    return position === undefined ? null : rounded(run.stableDayOfLesson.get(position))
  })
}

const runs = new Map<string, Run>()
const memoizedRunOf = (terms: Terms): Run => {
  const key = JSON.stringify({ ...terms, wordsNeeded: terms.wordsNeeded.name })
  const known = runs.get(key)
  if (known !== undefined) {
    return known
  }
  const run = runOf(terms)
  runs.set(key, run)
  return run
}

const firstDayHolding = (run: Run, words: number): number | null => {
  const minute = run.stableByMinute.findIndex((stable) => stable >= words)
  return minute < 0 ? null : rounded(minute / 1_440)
}

describe('trunk: what the skills save, no word need', () => {
  it('pays every building level on a balanced run at these days with the cycle skills', () => {
    const run = memoizedRunOf(termsOf({}))
    expect(everyBuildingDaysOf(run)).toEqual([6.6, 11.9, 19.5, 28.8, 42.5, 63.1, 89.4, null])
  })

  it('pays them later with no skill at all', () => {
    const run = memoizedRunOf(termsOf({ skillRule: 'none' }))
    expect(everyBuildingDaysOf(run)).toEqual([6.6, 11.9, 19.8, 31.7, 49.5, 76.3, null, null])
  })

  it('saves the same with the money skills alone as with every skill', () => {
    const money = memoizedRunOf(termsOf({ skillRule: 'moneyOnly' }))
    const every = memoizedRunOf(termsOf({}))
    expect(everyBuildingDaysOf(money)).toEqual(everyBuildingDaysOf(every))
  })

  it('saves nothing with the food, material and power skills', () => {
    const others = memoizedRunOf(termsOf({ skillRule: 'cycleWithoutMoney' }))
    const none = memoizedRunOf(termsOf({ skillRule: 'none' }))
    expect(everyBuildingDaysOf(others)).toEqual(everyBuildingDaysOf(none))
  })

  it('pays the homes on a homes-only run at the same days with or without skills', () => {
    const cycled = memoizedRunOf(termsOf({ plan: 'homesOnly' }))
    const none = memoizedRunOf(termsOf({ plan: 'homesOnly', skillRule: 'none' }))
    expect(homesDaysOf(cycled)).toEqual([0, 0, 0.3, 0.9, 1.9, 3.3, 5.7, 9.2, 14.5])
    expect(homesDaysOf(none)).toEqual(homesDaysOf(cycled))
  })

  it('earns lesson 1, 4, 8, 16 and 24 skills on these days for a learner on time', () => {
    const run = memoizedRunOf(termsOf({}))
    const days = [1, 4, 8, 16, 24].map((lesson) => rounded(run.finishedDay.get(`skill ${lesson}`)))
    expect(days).toEqual([13, 15, 17, 19.7, 23.1])
  })
})

describe('the stable words a learner holds', () => {
  it('reaches these counts on days 2.1 to 16.1 on a homes-only run, on time', () => {
    const run = memoizedRunOf(termsOf({ plan: 'homesOnly' }))
    expect(stableWordsOnDays(run, [2, 2.1, 4.1, 6.1, 8.1, 10.1, 12.1, 14.1, 16.1])).toEqual([
      0, 15, 30, 45, 60, 75, 90, 105, 120,
    ])
  })
})

describe('the retained words a learner holds', () => {
  it('follows the stable count 11 days behind on a homes-only run, on time', () => {
    const run = memoizedRunOf(termsOf({ plan: 'homesOnly' }))
    const counts = [13, 13.1, 15.1, 17.1].map(
      (day) => run.retainedByMinute[Math.round(day * 1_440)],
    )
    expect(counts).toEqual([0, 15, 30, 45])
  })
})

describe('a word turns stable', () => {
  it('reaches a stability of 7 or more at its first recall, 2 days and 10 minutes after its lesson', () => {
    const finishedAt = Instant.fromEpochMilliseconds(START)
    const terms = defaultMemoryTerms
    const first = unwrapped(
      reviewMemoryCard(MemoryCard.entered(finishedAt), 'good', finishedAt, terms),
    )
    const secondAt = unwrapped(dueInstantOf(first, terms))
    const second = unwrapped(reviewMemoryCard(first, 'good', secondAt, terms))
    const recallAt = unwrapped(dueInstantOf(second, terms))
    const recalled = unwrapped(reviewMemoryCard(second, 'good', recallAt, terms))
    const held = [{ wordId: 'a', card: recalled }]
    expect((recallAt.epochMilliseconds - START) / MINUTE).toBe(2 * 1_440 + 10)
    expect(second.stored.stability).toBe(2.3065)
    expect(Math.round((recalled.stored.stability ?? 0) * 10_000) / 10_000).toBe(10.971)
    expect(cardsInLearningOf(held)).toBe(0)
  })
})

describe('the shipped words', () => {
  it('holds 80 card words in the chrome lessons and 135 in every lesson', () => {
    const wordsIn = (files: ReadonlyArray<{ wordIds: ReadonlyArray<string> }>): number =>
      files.reduce((sum, file) => sum + file.wordIds.length, 0)
    expect(wordsIn(lessonFiles.slice(0, curriculum.chromeLessonCount))).toBe(80)
    expect(wordsIn(lessonFiles)).toBe(135)
  })

  it('draws more band 1 words for the holdout than the band 1 lessons ship', () => {
    const lessonCatalog = JsonLessonCatalog.fromDirectory(contentPath(''))
    const drawable = lessonCatalog.wordsOfBand(1).filter(({ isChrome }) => !isChrome).length
    const bandWordsShipped = lessonFiles
      .slice(curriculum.chromeLessonCount)
      .reduce((sum, file) => sum + file.wordIds.length, 0)
    expect(drawable).toBe(875)
    expect(Math.floor(drawable / 10)).toBe(87)
    expect(bandWordsShipped).toBe(55)
  })

  it("needs 80 retained words for level 10, the chrome lessons' words its floor", () => {
    expect([3, 4, 5, 6, 7, 8, 9, 10].map(tenPerLevelFromThree)).toEqual([
      10, 20, 30, 40, 50, 60, 70, 80,
    ])
  })

  it('would spend 210 words to raise all seven buildings to level 4 if words were spent', () => {
    const spentTo = (level: number): number =>
      7 *
      [3, 4, 5, 6, 7, 8, 9, 10]
        .filter((each) => each <= level)
        .map(tenPerLevelFromThree)
        .reduce((sum, each) => sum + each, 0)
    expect(spentTo(3)).toBe(70)
    expect(spentTo(4)).toBe(210)
  })
})

describe('a money skill', () => {
  it('raises the tax by 1 money per hour for each lesson, to 47 after the 27 shipped lessons', () => {
    const at = Instant.fromEpochMilliseconds(START)
    const moneySkills = (count: number): Array<TownSkill> =>
      Array.from({ length: count }, (_, index) => ({
        lessonId: lessonIds[index] ?? '',
        resource: 'money',
        ratePercent: 5,
        earnedAt: at,
      }))
    const moneyRateWith = (count: number): number =>
      unwrapped(deriveResourceRates(foundingLevels, 'fields', moneySkills(count), catalog, at))
        .money
    expect([0, 1, 27].map(moneyRateWith)).toEqual([20, 21, 47])
  })
})

describe('the stable need alone, every lesson on money', () => {
  it('pays the homes on a homes-only run, on time, at these days', () => {
    const run = memoizedRunOf(stableOnly({ plan: 'homesOnly' }))
    expect(homesDaysOf(run)).toEqual([0, 2, 4, 4, 6, 8.1, 10.1, 13.3, 18])
    expect(refusalsOf(run)).toEqual([
      'homes 3 at 0',
      'homes 4 at 2',
      'homes 5 at 4',
      'homes 6 at 4.4',
      'homes 7 at 6.8',
    ])
  })

  it('pays the homes on a homes-only run, played once a day, at these days', () => {
    const run = memoizedRunOf(stableOnly({ plan: 'homesOnly', learner: 'daily' }))
    expect(homesDaysOf(run)).toEqual([0.5, 2.5, 5.5, 5.5, 7.5, 10.5, 13.5, 16.6, 20.6])
    expect(refusalsOf(run)).toHaveLength(5)
  })

  it('pays the homes on a homes-only run, played every third day, at these days', () => {
    const run = memoizedRunOf(stableOnly({ plan: 'homesOnly', learner: 'everyThirdDay' }))
    expect(homesDaysOf(run)).toEqual([0.5, 3.5, 6.5, 6.5, 9.5, 12.5, 18.5, 21.6, 24.6])
    expect(refusalsOf(run)).toEqual(['homes 3 at 0.5', 'homes 4 at 3.5'])
  })

  it('pays every building level on a balanced run, on time, at these days', () => {
    const run = memoizedRunOf(stableOnly({}))
    expect(everyBuildingDaysOf(run)).toEqual([6.6, 11.9, 18.1, 24.2, 31.8, 43.2, 57.7, 69.9])
    expect(refusalsOf(run)).toEqual(['farm 3 at 0.5', 'farm 4 at 2.7'])
  })

  it('pays every building level on a balanced run, played once a day, at these days', () => {
    const run = memoizedRunOf(stableOnly({ learner: 'daily' }))
    expect(everyBuildingDaysOf(run)).toEqual([2.5, 12.5, 19.5, 25.5, 33.5, 44.6, 59.6, 71.7])
    expect(refusalsOf(run)).toEqual(['farm 3 at 1.5', 'farm 4 at 3.5'])
  })

  it('never refuses a balanced run played every third day for words', () => {
    const run = memoizedRunOf(stableOnly({ learner: 'everyThirdDay' }))
    expect(everyBuildingDaysOf(run)).toEqual([9.5, 15.5, 21.5, 30.5, 36.6, 48.6, 63.6, 75.7])
    expect(refusalsOf(run)).toEqual([])
  })

  it('holds a town that never studies at level 2 of every building from day 2.2', () => {
    const run = memoizedRunOf(stableOnly({ learner: 'none' }))
    expect(everyBuildingDaysOf(run)).toEqual([2.2, null, null, null, null, null, null, null])
    expect(Object.values(run.levels)).toEqual([2, 2, 2, 2, 2, 2, 2])
  })

  it('holds the 80 words level 10 needs on day 12.1 homes-only and day 8 balanced, on time', () => {
    expect(firstDayHolding(memoizedRunOf(stableOnly({ plan: 'homesOnly' })), 80)).toBe(12.1)
    expect(firstDayHolding(memoizedRunOf(stableOnly({})), 80)).toBe(8)
  })
})

describe('the options weighed', () => {
  it('saves nothing with the food, material and power skills on top of every lesson on money', () => {
    const both = memoizedRunOf(termsOf({ skillRule: 'everyLessonMoneyAndCycleWithoutMoney' }))
    const money = memoizedRunOf(termsOf({ skillRule: 'everyLessonMoney' }))
    expect(everyBuildingDaysOf(both)).toEqual(everyBuildingDaysOf(money))
  })

  it('pays a balanced run at these days with every lesson on money and no word need', () => {
    const run = memoizedRunOf(termsOf({ skillRule: 'everyLessonMoney' }))
    expect(everyBuildingDaysOf(run)).toEqual([6.6, 11.9, 18.2, 24.4, 32, 43.4, 57.9, 70])
    const homes = memoizedRunOf(termsOf({ plan: 'homesOnly', skillRule: 'everyLessonMoney' }))
    expect(homesDaysOf(homes)).toEqual([0, 0, 0.3, 0.9, 1.9, 3.3, 5.7, 9.2, 14.3])
  })

  it('pays the runs at these days with the word need and the cycle skills', () => {
    const homes = memoizedRunOf(termsOf({ plan: 'homesOnly', wordsNeeded: tenPerLevelFromThree }))
    expect(homesDaysOf(homes)).toEqual([0, 2, 4, 4, 6, 8.1, 10.1, 13.3, 18.4])
    const run = memoizedRunOf(termsOf({ wordsNeeded: tenPerLevelFromThree }))
    expect(everyBuildingDaysOf(run)).toEqual([6.6, 11.9, 19.3, 28.7, 42.4, 63, 89.3, null])
  })

  it('pays the runs at these days with 0.2 money per hour for each stable word', () => {
    const run = memoizedRunOf(termsOf({ moneyPerStableWordPerHour: 0.2 }))
    expect(everyBuildingDaysOf(run)).toEqual([5.7, 9, 12.9, 17.9, 24.8, 34.9, 47.8, 58.6])
    const homes = memoizedRunOf(termsOf({ plan: 'homesOnly', moneyPerStableWordPerHour: 0.2 }))
    expect(homesDaysOf(homes)).toEqual([0, 0, 0.3, 0.9, 1.9, 3.1, 5.1, 8.3, 13.1])
  })

  it('pays a balanced run on trunk at these days, played once a day or every third day', () => {
    expect(everyBuildingDaysOf(memoizedRunOf(termsOf({ learner: 'daily' })))).toEqual([
      7.5,
      12.5,
      20.5,
      29.5,
      43.5,
      63.6,
      null,
      null,
    ])
    expect(everyBuildingDaysOf(memoizedRunOf(termsOf({ learner: 'everyThirdDay' })))).toEqual([
      9.5,
      15.5,
      21.5,
      33.5,
      45.6,
      66.6,
      null,
      null,
    ])
  })
})

describe('the shipped lessons a school admits', () => {
  it('admits every shipped lesson at school level 1, so every need counts all 80 chrome words', () => {
    const levels = lessonFiles.map(
      (file: { requiredSchoolLevel: number }) => file.requiredSchoolLevel,
    )
    expect(new Set(levels)).toEqual(new Set([1]))
  })
})

describe('retained words alone open levels from 3', () => {
  it('opens homes 3 on day 13 on a homes-only run, on time, the day a skill lands', () => {
    const run = memoizedRunOf(retainedOnly({ plan: 'homesOnly' }))
    expect(homesDaysOf(run)).toEqual([0, 13, 15, 15, 17, 19.1, 21.1, 24.2, 29])
  })

  it('pays every building level on a balanced run, on time, at these days', () => {
    const run = memoizedRunOf(retainedOnly({}))
    expect(everyBuildingDaysOf(run)).toEqual([2.2, 13.1, 21.6, 27.1, 34.7, 46.1, 60.6, 72.7])
    expect(refusalsOf(run)).toEqual(['farm 3 at 0.5', 'farm 4 at 13', 'farm 5 at 14.2'])
  })

  it('pays every building level on a balanced run, played once a day, at these days', () => {
    const run = memoizedRunOf(retainedOnly({ learner: 'daily' }))
    expect(everyBuildingDaysOf(run)).toEqual([2.5, 14.5, 23.5, 28.6, 36.5, 47.6, 62.6, 74.7])
  })
})

describe('the decision: stable words open levels 3 to 6, retained words 7 to 10', () => {
  it('pays the homes on a homes-only run, on time, at these days', () => {
    const run = memoizedRunOf(decided({ plan: 'homesOnly' }))
    expect(homesDaysOf(run)).toEqual([0, 2, 4, 4, 6, 19.1, 21.1, 24.2, 29])
    expect(refusalsOf(run)).toEqual([
      'homes 3 at 0',
      'homes 4 at 2',
      'homes 5 at 4',
      'homes 6 at 4.4',
      'homes 7 at 6.8',
    ])
  })

  it('pays the homes on a homes-only run, played once a day, at these days', () => {
    const run = memoizedRunOf(decided({ plan: 'homesOnly', learner: 'daily' }))
    expect(homesDaysOf(run)).toEqual([0.5, 2.5, 5.5, 5.5, 7.5, 21.5, 24.5, 27.6, 31.6])
    expect(refusalsOf(run)).toEqual([
      'homes 3 at 0.5',
      'homes 4 at 2.5',
      'homes 5 at 5.5',
      'homes 6 at 6.5',
      'homes 7 at 8.5',
    ])
  })

  it('pays the homes on a homes-only run, played every third day, at these days', () => {
    const run = memoizedRunOf(decided({ plan: 'homesOnly', learner: 'everyThirdDay' }))
    expect(homesDaysOf(run)).toEqual([0.5, 3.5, 6.5, 6.5, 9.5, 24.5, 30.5, 33.6, 36.6])
    expect(refusalsOf(run)).toEqual(['homes 3 at 0.5', 'homes 4 at 3.5', 'homes 7 at 12.5'])
  })

  it('pays every building level on a balanced run, on time, on the days of the stable need alone', () => {
    const run = memoizedRunOf(decided({}))
    expect(everyBuildingDaysOf(run)).toEqual([6.6, 11.9, 18.1, 24.2, 31.8, 43.2, 57.7, 69.9])
    expect(refusalsOf(run)).toEqual(['farm 3 at 0.5', 'farm 4 at 2.7', 'farm 7 at 15.5'])
  })

  it('pays every building level on a balanced run, played once a day, at these days', () => {
    const run = memoizedRunOf(decided({ learner: 'daily' }))
    expect(everyBuildingDaysOf(run)).toEqual([2.5, 12.5, 18.5, 25.5, 33.5, 44.6, 59.6, 71.7])
    expect(refusalsOf(run)).toEqual(['farm 3 at 1.5', 'farm 4 at 3.5', 'farm 7 at 16.5'])
  })

  it('pays every building level on a balanced run, played every third day, at these days', () => {
    const run = memoizedRunOf(decided({ learner: 'everyThirdDay' }))
    expect(everyBuildingDaysOf(run)).toEqual([9.5, 15.5, 21.5, 30.5, 36.6, 48.6, 63.6, 75.7])
    expect(refusalsOf(run)).toEqual(['farm 7 at 18.5'])
  })

  it('holds a town that never studies at level 2 of every building', () => {
    const run = memoizedRunOf(decided({ learner: 'none' }))
    expect(Object.values(run.levels)).toEqual([2, 2, 2, 2, 2, 2, 2])
  })

  it('holds the 80 retained words level 10 needs on day 23.1 homes-only and day 19 balanced, on time', () => {
    expect(firstDayRetaining(memoizedRunOf(decided({ plan: 'homesOnly' })), 80)).toBe(23.1)
    expect(firstDayRetaining(memoizedRunOf(decided({})), 80)).toBe(19)
  })
})

describe('a player who stops reviewing a word once it is stable', () => {
  it('still builds homes 10 under the stable need alone, on day 18.6 against 18', () => {
    const run = memoizedRunOf(stableOnly({ plan: 'homesOnly', reviewHabit: 'skipsOnceStable' }))
    expect(homesDaysOf(run)).toEqual([0, 2, 4, 4, 6, 8.1, 10.1, 13.3, 18.6])
  })

  it('stops at level 6 under the decision, homes-only or balanced', () => {
    const homes = memoizedRunOf(decided({ plan: 'homesOnly', reviewHabit: 'skipsOnceStable' }))
    const balanced = memoizedRunOf(decided({ reviewHabit: 'skipsOnceStable' }))
    expect(homes.levels.homes).toBe(6)
    expect(Object.values(balanced.levels)).toEqual([6, 6, 6, 6, 6, 6, 6])
  })
})

describe('each place needing the words of its own resource', () => {
  it('holds 10, 20 and 30 words per pool on these days, homes-only, on time', () => {
    const run = memoizedRunOf(stableOnly({ plan: 'homesOnly' }))
    expect(poolDaysOf(run, 'food')).toEqual([4, 10.1, 14.1])
    expect(poolDaysOf(run, 'material')).toEqual([4, 10.1, 16.1])
    expect(poolDaysOf(run, 'power')).toEqual([6, 10.1, 16.1])
    expect([10, 20, 30].map((words) => firstDayHolding(run, words))).toEqual([2, 4, 4])
  })
})

const retainedRangeOf = (run: Run, fromDay: number, toDay: number): ReadonlyArray<number> => {
  const counts = run.retainedByMinute.slice(fromDay * 1_440, toDay * 1_440)
  return [Math.min(...counts), Math.max(...counts)]
}

describe('a player who misses 3 recalls in 10, under the decision', () => {
  const missing = (overrides: Partial<Terms>): Run =>
    memoizedRunOf(decided({ reviewHabit: 'missesThreeRecallsInTen', ...overrides }))

  it('holds 80 retained words on day 48.9 on a balanced run, on time, and 83 to 95 from day 60 to 90', () => {
    const run = missing({})
    expect(firstDayRetaining(run, 80)).toBe(48.9)
    expect(retainedRangeOf(run, 60, 90)).toEqual([83, 95])
  })

  it('pays every building level on a balanced run, on time, at these days', () => {
    const run = missing({})
    expect(everyBuildingDaysOf(run)).toEqual([6.1, 11.9, 18.4, 23.5, 26.4, 66.9, 88.1, null])
    expect(Object.values(run.levels)).toEqual([10, 10, 10, 10, 9, 9, 8])
  })

  it('holds 80 retained words on day 45.5 on a balanced run, played once a day, and 92 to 100 from day 60 to 90', () => {
    const run = missing({ learner: 'daily' })
    expect(firstDayRetaining(run, 80)).toBe(45.5)
    expect(retainedRangeOf(run, 60, 90)).toEqual([92, 100])
  })

  it('stops a homes-only run at homes 6, the school never raised and its learning cap of 15 full', () => {
    const run = missing({ plan: 'homesOnly' })
    expect(homesDaysOf(run)).toEqual([0, 2, 6, 27, 31.1, null, null, null, null])
    expect(run.cards).toHaveLength(60)
    expect(retainedRangeOf(run, 60, 90)).toEqual([36, 46])
  })
})
