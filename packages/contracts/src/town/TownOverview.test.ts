import { describe, expect, it } from 'vitest'
import { TownOverviewSchema } from '../index'
import {
  besideSchool,
  earnedFood,
  lessonOne,
  lessonUnderStudy,
  overview,
  stock,
  truckTerms,
  workerTerms,
} from './TownOverview.testSupport'

const openOrder = {
  hire: 'worker',
  count: 3,
  delivered: 1,
  secondsPerHire: 60,
  startedAt: '2026-11-10T08:55:00.000Z',
  endsAt: '2026-11-10T08:58:00.000Z',
}

const jobOut = {
  kind: 'job',
  site: { region: 1, area: 2, site: 5 },
  team: { worker: 2, truck: 1 },
  hours: 2,
  pay: { money: 0, food: 120, power: 0, material: 40 },
  phase: 'working',
  sentAt: '2026-11-10T08:00:00.000Z',
  arrivesAt: '2026-11-10T08:10:00.000Z',
  leavesAt: '2026-11-10T10:10:00.000Z',
  returnsAt: '2026-11-10T10:20:00.000Z',
  calledBackAt: null,
}

const cleanUpOut = {
  kind: 'cleanUp',
  site: { region: 1, area: 2, site: 4 },
  team: { worker: 6, truck: 0 },
  size: 1,
  waste: 6,
  pay: { money: 12, food: 0, power: 0, material: 18 },
  phase: 'outbound',
  sentAt: '2026-11-10T08:00:00.000Z',
  arrivesAt: '2026-11-10T08:10:00.000Z',
  leavesAt: '2026-11-10T08:10:00.000Z',
  returnsAt: '2026-11-10T08:20:00.000Z',
  calledBackAt: null,
}

const farmLevelThree = {
  level: 3,
  cost: { money: 120, food: 0, power: 0, material: 160 },
  durationSeconds: 300,
  people: 1,
}

const overviewWithFarm = (farm: Record<string, unknown>): Record<string, unknown> => {
  const base = overview()
  return overview({ buildings: { ...(base.buildings as Record<string, unknown>), farm } })
}

const summer = {
  kind: 'summer',
  year: 2,
  endsAt: '2026-11-16T00:00:00.000Z',
  productionPercent: { money: 100, food: 125, power: 100, material: 100 },
  durationPercent: { build: 75, study: 100, hire: 100, road: 100 },
}

describe('TownOverviewSchema', () => {
  it('parses a season with its production and duration percents', () => {
    expect(TownOverviewSchema.parse(overview({ season: summer })).season).toEqual(summer)
  })

  it('rejects a season missing the production percent of a resource', () => {
    const { power: _, ...threeResources } = summer.productionPercent

    expect(
      TownOverviewSchema.safeParse(
        overview({ season: { ...summer, productionPercent: threeResources } }),
      ).success,
    ).toBe(false)
  })

  it('rejects a season duration percent of 0', () => {
    const durationPercent = { ...summer.durationPercent, road: 0 }

    expect(
      TownOverviewSchema.safeParse(overview({ season: { ...summer, durationPercent } })).success,
    ).toBe(false)
  })

  it('parses a job out with its pay and its instants', () => {
    expect(TownOverviewSchema.parse(overview({ job: jobOut })).job).toEqual(jobOut)
  })

  it('parses a job called back with the instant of the call', () => {
    const calledBack = { ...jobOut, phase: 'returning', calledBackAt: '2026-11-10T09:00:00.000Z' }

    expect(TownOverviewSchema.parse(overview({ job: calledBack })).job).toEqual(calledBack)
  })

  it('rejects a job of no hours', () => {
    expect(TownOverviewSchema.safeParse(overview({ job: { ...jobOut, hours: 0 } })).success).toBe(
      false,
    )
  })

  it('parses a clean-up out with the size and the waste of its site', () => {
    expect(TownOverviewSchema.parse(overview({ job: cleanUpOut })).job).toEqual(cleanUpOut)
  })

  it('rejects a clean-up given hours', () => {
    expect(
      TownOverviewSchema.safeParse(overview({ job: { ...cleanUpOut, hours: 2 } })).success,
    ).toBe(false)
  })

  it('rejects a clean-up of a waste size the town does not know', () => {
    expect(
      TownOverviewSchema.safeParse(overview({ job: { ...cleanUpOut, size: 4 } })).success,
    ).toBe(false)
  })

  it('rejects a job phase the town does not know', () => {
    expect(
      TownOverviewSchema.safeParse(overview({ job: { ...jobOut, phase: 'lost' } })).success,
    ).toBe(false)
  })

  it('parses an open hiring order with its delivered count', () => {
    const hiring = {
      order: openOrder,
      hires: { worker: 1, truck: 0 },
      terms: { worker: workerTerms, truck: truckTerms },
    }

    expect(TownOverviewSchema.parse(overview({ hiring })).hiring).toEqual(hiring)
  })

  it('rejects hires missing a kind', () => {
    const hiring = {
      order: null,
      hires: { worker: 1 },
      terms: { worker: workerTerms, truck: truckTerms },
    }

    expect(TownOverviewSchema.safeParse(overview({ hiring })).success).toBe(false)
  })

  it('rejects a hiring order of no hires', () => {
    const hiring = {
      order: { ...openOrder, count: 0, delivered: 0 },
      hires: { worker: 0, truck: 0 },
      terms: { worker: workerTerms, truck: truckTerms },
    }

    expect(TownOverviewSchema.safeParse(overview({ hiring })).success).toBe(false)
  })

  it('parses the lessons, the earned skills and the lesson under study', () => {
    expect(TownOverviewSchema.parse(overview())).toEqual(overview())
  })

  it('parses a school with no lesson under study', () => {
    expect(TownOverviewSchema.parse(overview({ lessonSlot: null })).lessonSlot).toBeNull()
  })

  it('rejects a lesson that still names a library level', () => {
    const { requiredSchoolLevel: _, ...withoutSchool } = lessonOne
    const lessons = [{ ...withoutSchool, requiredLibraryLevel: 1 }]

    expect(TownOverviewSchema.safeParse(overview({ lessons })).success).toBe(false)
  })

  it("rejects a lemma outside a lesson word's reading", () => {
    const words = [
      {
        wordId: 'lesson-1-1',
        standing: 'recall',
        reading: null,
        support: besideSchool,
        lemma: 'home',
      },
    ]

    expect(
      TownOverviewSchema.safeParse(overview({ lessons: [{ ...lessonOne, words }] })).success,
    ).toBe(false)
  })

  it('rejects a standing the school path does not have', () => {
    const words = [
      { wordId: 'lesson-1-1', standing: 'learned', reading: null, support: besideSchool },
    ]

    expect(
      TownOverviewSchema.safeParse(overview({ lessons: [{ ...lessonOne, words }] })).success,
    ).toBe(false)
  })

  it('rejects a reading without its frame', () => {
    const reading = { word: 'home' }
    const words = [{ wordId: 'lesson-1-1', standing: 'notStarted', reading, support: besideSchool }]

    expect(
      TownOverviewSchema.safeParse(overview({ lessons: [{ ...lessonOne, words }] })).success,
    ).toBe(false)
  })

  it('rejects a reading whose frame is a plain string', () => {
    const reading = { word: 'school', frame: 'We are at school.' }
    const words = [{ wordId: 'lesson-1-2', standing: 'recognize', reading, support: besideSchool }]

    expect(
      TownOverviewSchema.safeParse(overview({ lessons: [{ ...lessonOne, words }] })).success,
    ).toBe(false)
  })

  it('rejects a lesson word without its support', () => {
    const words = [{ wordId: 'lesson-1-1', standing: 'notStarted', reading: null }]

    expect(
      TownOverviewSchema.safeParse(overview({ lessons: [{ ...lessonOne, words }] })).success,
    ).toBe(false)
  })

  it('parses a held-out word with no support', () => {
    const words = [{ wordId: 'lesson-1-1', standing: 'notStarted', reading: null, support: null }]

    expect(
      TownOverviewSchema.parse(overview({ lessons: [{ ...lessonOne, words }] })).lessons[0]?.words,
    ).toEqual(words)
  })

  it('rejects a support shown neither beside nor on tap', () => {
    const support = { ...besideSchool, shown: 'hidden' }
    const words = [{ wordId: 'lesson-1-1', standing: 'notStarted', reading: null, support }]

    expect(
      TownOverviewSchema.safeParse(overview({ lessons: [{ ...lessonOne, words }] })).success,
    ).toBe(false)
  })

  it('rejects a support in a language Townword does not show', () => {
    const support = { ...besideSchool, language: 'fr' }
    const words = [{ wordId: 'lesson-1-1', standing: 'notStarted', reading: null, support }]

    expect(
      TownOverviewSchema.safeParse(overview({ lessons: [{ ...lessonOne, words }] })).success,
    ).toBe(false)
  })

  it('parses each chrome phase', () => {
    expect(
      ['scaffold', 'both', 'english'].map(
        (chromePhase) => TownOverviewSchema.parse(overview({ chromePhase })).chromePhase,
      ),
    ).toEqual(['scaffold', 'both', 'english'])
  })

  it('carries whether any band has started', () => {
    expect(TownOverviewSchema.parse(overview({ hasBandStarted: true })).hasBandStarted).toBe(true)
  })

  it('rejects an overview that does not say whether a band has started', () => {
    const { hasBandStarted: _, ...withoutBandStart } = overview()

    expect(TownOverviewSchema.safeParse(withoutBandStart).success).toBe(false)
  })

  it('carries the held count and the total of each started band', () => {
    const bandLines = [{ band: 1, count: 12, total: 875 }]

    expect(TownOverviewSchema.parse(overview({ bandLines })).bandLines).toEqual(bandLines)
  })

  it('rejects an overview without the band lines', () => {
    const { bandLines: _, ...withoutBandLines } = overview()

    expect(TownOverviewSchema.safeParse(withoutBandLines).success).toBe(false)
  })

  it('rejects a band line of a band placement does not know', () => {
    const bandLines = [{ band: 4, count: 0, total: 875 }]

    expect(TownOverviewSchema.safeParse(overview({ bandLines })).success).toBe(false)
  })

  it('carries the scaffold language and its version', () => {
    const parsed = TownOverviewSchema.parse(overview({ scaffold: 'none', scaffoldVersion: 4 }))

    expect([parsed.scaffold, parsed.scaffoldVersion]).toEqual(['none', 4])
  })

  it('rejects an overview without a scaffold version', () => {
    const { scaffoldVersion: _, ...withoutScaffoldVersion } = overview()

    expect(TownOverviewSchema.safeParse(withoutScaffoldVersion).success).toBe(false)
  })

  it('rejects a scaffold version that is not a whole number', () => {
    expect(TownOverviewSchema.safeParse(overview({ scaffoldVersion: 1.5 })).success).toBe(false)
  })

  it('rejects a scaffold language Townword does not offer', () => {
    expect(TownOverviewSchema.safeParse(overview({ scaffold: 'fr' })).success).toBe(false)
  })

  it('rejects a chrome phase the scaffold does not have', () => {
    expect(TownOverviewSchema.safeParse(overview({ chromePhase: 'spanish' })).success).toBe(false)
  })

  it('rejects a skill earned on a medieval resource', () => {
    const skills = [{ ...earnedFood, resource: 'gold' }]

    expect(TownOverviewSchema.safeParse(overview({ skills })).success).toBe(false)
  })

  it('rejects a lesson under study without its finish', () => {
    const { finishesAt: _, ...withoutFinish } = lessonUnderStudy

    expect(TownOverviewSchema.safeParse(overview({ lessonSlot: withoutFinish })).success).toBe(
      false,
    )
  })

  it('rejects an overview without its learning load', () => {
    const { learning: _, ...withoutLearning } = overview()

    expect(TownOverviewSchema.safeParse(withoutLearning).success).toBe(false)
  })

  it('rejects a fractional count of words in learning', () => {
    const learning = { cap: 15, inLearning: 2.5, retainedWords: null, nextInLearningDueAt: null }

    expect(TownOverviewSchema.safeParse(overview({ learning })).success).toBe(false)
  })

  it('accepts a count of retained words', () => {
    const learning = {
      cap: 15,
      inLearning: 5,
      retainedWords: { count: 3, total: 5 },
      nextInLearningDueAt: null,
    }

    expect(TownOverviewSchema.safeParse(overview({ learning })).success).toBe(true)
  })

  it('rejects a learning load without its retained words', () => {
    const learning = { cap: 15, inLearning: 5 }

    expect(TownOverviewSchema.safeParse(overview({ learning })).success).toBe(false)
  })

  it('rejects retained words with a total of none', () => {
    const learning = {
      cap: 15,
      inLearning: 5,
      retainedWords: { count: 0, total: 0 },
      nextInLearningDueAt: null,
    }

    expect(TownOverviewSchema.safeParse(overview({ learning })).success).toBe(false)
  })

  it('accepts the instant the next word in learning is due', () => {
    const learning = {
      cap: 15,
      inLearning: 15,
      retainedWords: null,
      nextInLearningDueAt: '2026-11-20T09:15:00.000Z',
    }

    expect(TownOverviewSchema.safeParse(overview({ learning })).success).toBe(true)
  })

  it('rejects a learning load without when the next word in learning is due', () => {
    const learning = { cap: 15, inLearning: 15, retainedWords: null }

    expect(TownOverviewSchema.safeParse(overview({ learning })).success).toBe(false)
  })

  it('parses a next level with the stable words it needs', () => {
    const farm = {
      level: 2,
      nextLevel: { ...farmLevelThree, wordsNeeded: { count: 10, standing: 'stable' } },
    }

    expect(TownOverviewSchema.safeParse(overviewWithFarm(farm)).success).toBe(true)
  })

  it('rejects a next level without its word need', () => {
    const farm = { level: 2, nextLevel: farmLevelThree }

    expect(TownOverviewSchema.safeParse(overviewWithFarm(farm)).success).toBe(false)
  })

  it('rejects a word need of a school path standing', () => {
    const wordsNeeded = { count: 10, standing: 'hold' }
    const farm = { level: 2, nextLevel: { ...farmLevelThree, wordsNeeded } }

    expect(TownOverviewSchema.safeParse(overviewWithFarm(farm)).success).toBe(false)
  })

  it('rejects a word need of no words', () => {
    const wordsNeeded = { count: 0, standing: 'stable' }
    const farm = { level: 2, nextLevel: { ...farmLevelThree, wordsNeeded } }

    expect(TownOverviewSchema.safeParse(overviewWithFarm(farm)).success).toBe(false)
  })

  it("rejects an overview without the town's stable word count", () => {
    const { stableWordCount: _, ...withoutStableWords } = overview()

    expect(TownOverviewSchema.safeParse(withoutStableWords).success).toBe(false)
  })

  it('rejects a fractional count of retained words in the town', () => {
    expect(TownOverviewSchema.safeParse(overview({ retainedWordCount: 1.5 })).success).toBe(false)
  })

  it('rejects an overview without its lessons', () => {
    const { lessons: _, ...withoutLessons } = overview()

    expect(TownOverviewSchema.safeParse(withoutLessons).success).toBe(false)
  })
})

describe('TownOverviewSchema holdout', () => {
  const releasedLesson = {
    id: 'released-1-1',
    band: 1,
    position: 1,
    durationSeconds: 300,
    requiredSchoolLevel: 1,
    isStudied: false,
    words: lessonOne.words,
    enteringWordCount: lessonOne.enteringWordCount,
  }

  it('reads the due checks by band and week', () => {
    const dueHoldoutChecks = [
      { band: 1, week: 24 },
      { band: 2, week: 8 },
    ]

    expect(TownOverviewSchema.parse(overview({ dueHoldoutChecks })).dueHoldoutChecks).toEqual(
      dueHoldoutChecks,
    )
  })

  it('reads a released lesson with its band, set and words', () => {
    const releasedLessons = [releasedLesson]

    expect(TownOverviewSchema.parse(overview({ releasedLessons })).releasedLessons).toEqual(
      releasedLessons,
    )
  })

  it('refuses a released lesson with a skill, since it earns none', () => {
    const releasedLessons = [{ ...releasedLesson, skill: lessonOne.skill }]

    expect(TownOverviewSchema.safeParse(overview({ releasedLessons })).success).toBe(false)
  })

  it('refuses a released lesson with a theme', () => {
    const releasedLessons = [{ ...releasedLesson, theme: lessonOne.theme }]

    expect(TownOverviewSchema.safeParse(overview({ releasedLessons })).success).toBe(false)
  })

  it('reads each open text by its id and its title', () => {
    const texts = [
      { id: 'text-2', title: 'The Long Report' },
      { id: 'text-1', title: 'A New Course' },
    ]

    expect(TownOverviewSchema.parse(overview({ texts })).texts).toEqual(texts)
  })

  it('rejects an open text that carries its sentences', () => {
    const texts = [
      {
        id: 'text-1',
        title: 'A New Course',
        sentences: [[{ text: 'We are at school.', support: null }]],
      },
    ]

    expect(TownOverviewSchema.safeParse(overview({ texts })).success).toBe(false)
  })

  it('rejects an overview without its texts', () => {
    const { texts: _, ...withoutTexts } = overview()

    expect(TownOverviewSchema.safeParse(withoutTexts).success).toBe(false)
  })

  it('rejects an overview without its due checks', () => {
    const { dueHoldoutChecks: _, ...withoutChecks } = overview()

    expect(TownOverviewSchema.safeParse(withoutChecks).success).toBe(false)
  })
})

describe('TownOverviewSchema tip', () => {
  it('reads the tip to show', () => {
    expect(TownOverviewSchema.parse(overview({ tip: 'waitingList' })).tip).toBe('waitingList')
  })

  it('refuses a tip the town does not know', () => {
    expect(TownOverviewSchema.safeParse(overview({ tip: 'peasants' })).success).toBe(false)
  })

  it('refuses an overview without its tip', () => {
    const { tip: _, ...withoutTip } = overview()

    expect(TownOverviewSchema.safeParse(withoutTip).success).toBe(false)
  })
})

describe('TownOverviewSchema stock fill instant', () => {
  it('reads the instant a store fills', () => {
    const filling = { ...stock, fullAt: '2026-11-10T19:00:00.000Z' }
    const stocks = { money: stock, food: filling, power: stock, material: stock }

    expect(TownOverviewSchema.parse(overview({ stocks })).stocks.food.fullAt).toBe(filling.fullAt)
  })

  it('refuses a stock without its fill instant', () => {
    const { fullAt: _, ...withoutFullAt } = stock
    const stocks = { money: stock, food: withoutFullAt, power: stock, material: stock }

    expect(TownOverviewSchema.safeParse(overview({ stocks })).success).toBe(false)
  })
})
