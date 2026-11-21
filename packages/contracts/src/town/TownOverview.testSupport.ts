export const stock = { amount: 300, ratePerHour: 12.5, capacity: 1000, fullAt: null }

const idle = { level: 0, nextLevel: null }

export const besideSchool = { shown: 'beside', text: 'escuela', language: 'es' }

export const lessonOne = {
  id: 'lesson-1',
  theme: 'A day in town',
  durationSeconds: 150,
  requiredSchoolLevel: 1,
  skill: { resource: 'food', ratePercent: 5 },
  isStudied: true,
  words: [
    {
      wordId: 'lesson-1-1',
      standing: 'retained',
      reading: null,
      support: { shown: 'onTap', text: 'the place where you live', language: 'en' },
    },
    {
      wordId: 'lesson-1-2',
      standing: 'recognize',
      reading: {
        word: 'school',
        frame: [{ text: 'We are at school.', support: null }],
      },
      support: besideSchool,
    },
  ],
  enteringWordCount: 2,
}

export const earnedFood = {
  lessonId: 'lesson-1',
  resource: 'food',
  ratePercent: 5,
  earnedAt: '2026-11-23T09:10:00.000Z',
}

export const workerTerms = {
  cost: { money: 40, food: 0, power: 0, material: 0 },
  secondsPerHire: 60,
  people: 1,
  requiredOfficeLevel: 1,
}

export const truckTerms = {
  cost: { money: 80, food: 40, power: 40, material: 60 },
  secondsPerHire: 180,
  people: 1,
  requiredOfficeLevel: 3,
}

export const lessonUnderStudy = {
  lessonId: 'lesson-1',
  startedAt: '2026-11-10T08:57:30.000Z',
  finishesAt: '2026-11-10T09:00:00.000Z',
}

export const overview = (overrides: Record<string, unknown> = {}): Record<string, unknown> => ({
  name: 'Maple Falls',
  label: 'town',
  site: { region: 1, area: 1, site: 1 },
  terrain: 'fields',
  season: null,
  stocks: { money: stock, food: stock, power: stock, material: stock },
  people: { supplied: 10, free: 4, atWork: 6 },
  buildings: {
    homes: { level: 1, nextLevel: null },
    farm: idle,
    factory: idle,
    powerStation: idle,
    storage: idle,
    school: { level: 1, nextLevel: null },
    office: idle,
  },
  work: { slot: null, waitingList: [], cap: 4 },
  hiring: {
    order: null,
    hires: { worker: 2, truck: 0 },
    terms: { worker: workerTerms, truck: truckTerms },
  },
  job: null,
  lessons: [lessonOne],
  releasedLessons: [],
  texts: [],
  dueHoldoutChecks: [],
  hasBandStarted: false,
  bandLines: [],
  skills: [earnedFood],
  lessonSlot: lessonUnderStudy,
  learning: { cap: 15, inLearning: 5, retainedWords: null, nextInLearningDueAt: null },
  stableWordCount: 12,
  retainedWordCount: 4,
  nextStep: { kind: 'caughtUp', reason: 'lessonsDone', goal: null, text: null },
  tip: null,
  chromePhase: 'scaffold',
  scaffold: 'es',
  scaffoldVersion: 3,
  nextDueAt: null,
  readAt: '2026-11-10T08:58:00.000Z',
  ...overrides,
})
