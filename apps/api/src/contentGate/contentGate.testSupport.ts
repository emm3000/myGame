import type { CurriculumContent } from '@mygame/contracts'
import type { LexiconEntry } from '../adapters/json/lessonContentFilesOf'
import type { GateContent } from './GateContent'

type ContentParts = {
  readonly lexicon: ReadonlyArray<LexiconEntry>
  readonly lessons: ReadonlyArray<readonly [string, ReadonlyArray<string>]>
  readonly chromeLessonCount: number
  readonly frameWords: ReadonlyArray<readonly [string, string]>
  readonly ranks: ReadonlyMap<string, number>
  readonly forms: ReadonlyMap<string, ReadonlySet<string>>
  readonly skill: CurriculumContent['skill']
}

export const entryOf = (
  id: string,
  lemma: string,
  frame: string,
  extra: Partial<LexiconEntry> = {},
): LexiconEntry => ({
  id,
  lemma,
  partOfSpeech: 'noun',
  frame,
  gappedFrame: frame.replace(lemma, '____'),
  gloss: { es: `es-${lemma}` },
  ...extra,
})

export const lessonOneLexicon: ReadonlyArray<LexiconEntry> = [
  entryOf('lesson-1-1', 'home', 'This is my home.'),
  entryOf('lesson-1-2', 'school', 'We are at school.'),
  entryOf('lesson-1-3', 'work', 'They work for us.', { partOfSpeech: 'verb' }),
  entryOf('lesson-1-4', 'money', 'I do not have much money.'),
  entryOf('lesson-1-5', 'food', 'We have food for you.'),
]

const lessonOneFrameWords = [
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
  ['leave', 300],
  ['food', 367],
  ['left', 400],
]

const fixtureInflections: ReadonlyArray<readonly [string, ReadonlyArray<string>]> = [
  ['be', ['is', 'are', 'am']],
  ['i', ['me', 'my']],
  ['we', ['us', 'our']],
  ['home', ['homes']],
  ['work', ['works', 'worked']],
  ['leave', ['left']],
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
  frameWords: lessonOneFrameWords.map((word) => [word, 'lesson-1'] as const),
  ranks: new Map(fixtureRanks),
  forms: fixtureForms(),
  skill: { cycle: ['food', 'material', 'power', 'money'], ratePercent: 5 },
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
        requiredSchoolLevel: 1,
        wordIds: [...wordIds],
      },
      words: wordIds.flatMap((wordId) => parts.lexicon.find(({ id }) => id === wordId) ?? []),
    })),
    lexicon: [...parts.lexicon],
    ranks: parts.ranks,
    grammar: {
      frameWords: parts.frameWords.map(([word, admittingLessonId]) => ({
        word,
        admittingLessonId,
      })),
    },
    forms: parts.forms,
  }
}
