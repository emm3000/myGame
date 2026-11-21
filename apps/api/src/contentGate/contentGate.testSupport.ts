import type { CurriculumContent, GrammarContent, TextsContent } from '@mygame/contracts'
import type { LaterFrame, WordNeed } from '@mygame/domain'
import type { LexiconEntry } from '../adapters/json/lessonContentFilesOf'
import type { GateContent } from './GateContent'

type RunningText = TextsContent[number]

type ContentParts = {
  readonly lexicon: ReadonlyArray<LexiconEntry>
  readonly lessons: ReadonlyArray<readonly [string, ReadonlyArray<string>]>
  readonly chromeLessonCount: number
  readonly structures: GrammarContent['structures']
  readonly irregularVerbs: GrammarContent['irregularVerbs']
  readonly ranks: ReadonlyMap<string, number>
  readonly forms: ReadonlyMap<string, ReadonlySet<string>>
  readonly skill: CurriculumContent['skill']
  readonly englishMessages: Readonly<Record<string, string>>
  readonly wordNeed: WordNeed
  readonly schoolLevels: ReadonlyArray<number>
  readonly topBuildingLevel: number
  readonly requiredSchoolLevels: Readonly<Record<string, number>>
  readonly texts: ReadonlyArray<RunningText>
}

type EntryExtra = Partial<Omit<LexiconEntry, 'frames'>> & {
  readonly gappedFrame?: string
  readonly laterFrames?: ReadonlyArray<LaterFrame>
}

export const laterFrameOf = (lemma: string, frame: string, fromLessonId: string): LaterFrame => ({
  frame,
  gappedFrame: frame.replace(lemma, '____'),
  fromLessonId,
})

export const entryOf = (
  id: string,
  lemma: string,
  frame: string,
  { gappedFrame = frame.replace(lemma, '____'), laterFrames = [], ...extra }: EntryExtra = {},
): LexiconEntry => ({
  id,
  lemma,
  partOfSpeech: 'noun',
  frames: [{ frame, gappedFrame }, ...laterFrames],
  gloss: { es: `es-${lemma}` },
  ...extra,
})

export const lessonOneLexicon: ReadonlyArray<LexiconEntry> = [
  entryOf('lesson-1-1', 'home', 'This is my home.', { definition: 'we have food at this' }),
  entryOf('lesson-1-2', 'school', 'We are at school.', {
    definition: 'they work at this for money',
  }),
  entryOf('lesson-1-3', 'work', 'They work for us.', {
    partOfSpeech: 'verb',
    definition: 'you do this for money',
  }),
  entryOf('lesson-1-4', 'money', 'I do not have much money.', {
    definition: 'you have this for food',
  }),
  entryOf('lesson-1-5', 'food', 'We have food for you.', { definition: 'we have this at home' }),
]

export const textOf = (
  fromLessonId: string,
  sentences: ReadonlyArray<string>,
  extra: Partial<Omit<RunningText, 'fromLessonId' | 'sentences'>> = {},
): RunningText => ({
  id: 'text-1',
  fromLessonId,
  title: 'Food for you',
  sentences: [...sentences],
  ...extra,
})

type GrammarStructure = GrammarContent['structures'][number]

export const structureOf = (
  admittingLessonId: string,
  frameWords: ReadonlyArray<string>,
  inflections: ReadonlyArray<string> = [],
): GrammarStructure => ({
  name: `Grammar of ${admittingLessonId}`,
  cefr: 'A1.1',
  cefrjItem: '58',
  admittingLessonId,
  frameWords: [...frameWords],
  inflections: [...inflections],
})

export const lessonOneFrameWords: ReadonlyArray<string> = [
  'the',
  'be',
  'have',
  'you',
  'for',
  'they',
  'not',
  'we',
  'on',
  'this',
  'I',
  'do',
  'at',
  'much',
]

const fixtureRanks: ReadonlyArray<readonly [string, number]> = [
  ['the', 1],
  ['be', 2],
  ['have', 8],
  ['you', 10],
  ['for', 12],
  ['they', 13],
  ['not', 14],
  ['we', 16],
  ['on', 17],
  ['this', 19],
  ['i', 20],
  ['do', 21],
  ['at', 23],
  ['work', 67],
  ['new', 79],
  ['much', 91],
  ['school', 146],
  ['home', 161],
  ['money', 201],
  ['close', 250],
  ['leave', 300],
  ['food', 367],
  ['left', 400],
]

const fixtureInflections: ReadonlyArray<readonly [string, ReadonlyArray<string>]> = [
  ['be', ['is', 'are', 'am', 'was']],
  ['have', ['has']],
  ['i', ['me', 'my']],
  ['we', ['us', 'our']],
  ['home', ['homes']],
  ['work', ['works', 'worked', 'working']],
  ['new', ['newer', 'newest']],
  ['can', ['can', 'cannot']],
  ['will', ['will']],
  ['it', ['it']],
  ['there', ['there']],
  ['who', ['whom', 'whose']],
  ['go', ['goes', 'went', 'gone']],
  ['make', ['made']],
  ['try', ['tries']],
  ['leave', ['left']],
  ['close', ['closed']],
  ['see', ['see', 'saw', 'seen']],
  ['come', ['come', 'came']],
  ['he', ['he']],
  ['she', ['she']],
  ['that', ['that']],
  ['so', ['so']],
  ['after', ['after']],
]

export const lessonOneInflections: ReadonlyArray<string> = [
  'am',
  'is',
  'are',
  'me',
  'my',
  'us',
  'our',
]

const fixtureForms = (): ReadonlyMap<string, ReadonlySet<string>> => {
  const forms = new Map<string, Set<string>>(
    fixtureRanks.map(([lemma]) => [lemma, new Set([lemma])]),
  )
  for (const [headword, inflections] of fixtureInflections) {
    for (const form of inflections) {
      forms.set(form, new Set([...(forms.get(form) ?? []), headword]))
    }
  }
  return forms
}

const lessonOneParts = (): ContentParts => ({
  lexicon: lessonOneLexicon,
  lessons: [['lesson-1', lessonOneLexicon.map(({ id }) => id)]],
  chromeLessonCount: 1,
  structures: [structureOf('lesson-1', lessonOneFrameWords, lessonOneInflections)],
  irregularVerbs: [
    { lemma: 'go', past: 'went', pastParticiple: 'gone' },
    { lemma: 'make', past: 'made', pastParticiple: 'made' },
    { lemma: 'leave', past: 'left', pastParticiple: 'left' },
    { lemma: 'see', past: 'saw', pastParticiple: 'seen' },
    { lemma: 'come', past: 'came', pastParticiple: 'come' },
  ],
  ranks: new Map(fixtureRanks),
  forms: fixtureForms(),
  skill: { resource: 'money', ratePercent: 5 },
  englishMessages: {},
  wordNeed: { fromLevel: 3, perLevel: 10, retainedFromLevel: 7 },
  schoolLevels: Array.from({ length: 10 }, (_, index) => index + 1),
  topBuildingLevel: 10,
  requiredSchoolLevels: {},
  texts: [],
})

export const contentOf = (overrides: Partial<ContentParts> = {}): GateContent => {
  const parts = { ...lessonOneParts(), ...overrides }
  return {
    curriculum: {
      chromeLessonCount: parts.chromeLessonCount,
      lessonIds: parts.lessons.map(([id]) => id),
      skill: parts.skill,
    },
    lessons: parts.lessons.map(([id, wordIds]) => ({
      content: {
        id,
        theme: 'A day in town',
        durationSeconds: 300,
        requiredSchoolLevel: parts.requiredSchoolLevels[id] ?? 1,
        wordIds: [...wordIds],
      },
      words: wordIds.flatMap((wordId) => parts.lexicon.find(({ id }) => id === wordId) ?? []),
    })),
    lexicon: [...parts.lexicon],
    ranks: parts.ranks,
    grammar: { structures: [...parts.structures], irregularVerbs: [...parts.irregularVerbs] },
    forms: parts.forms,
    englishMessages: parts.englishMessages,
    wordNeed: parts.wordNeed,
    schoolLevels: parts.schoolLevels,
    topBuildingLevel: parts.topBuildingLevel,
    texts: [...parts.texts],
  }
}
