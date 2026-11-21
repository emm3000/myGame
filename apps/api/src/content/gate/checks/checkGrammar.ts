import { readingOf } from '../../infrastructure/json/readingOf'
import { type ReadingTerms, readingTermsOf } from '../../infrastructure/json/readingTermsOf'
import type { LexiconEntry } from '../../infrastructure/json/readLessonContentFiles'
import type { HaveBefore, IrregularForms } from '../CardWordFormContext'
import { cardWordFormOf } from '../cardWordFormOf'
import { frameWordAdmissionsOf } from '../frameWordAdmissionsOf'
import type { GateContent } from '../GateContent'
import { type GrammarPassage, grammarPassagesOf } from '../grammarPassagesOf'
import { inventoryFailuresOf } from '../inventoryFailuresOf'
import { lessonPositionOf } from '../lessonPositionOf'

type GrammarTerms = {
  readonly reading: ReadingTerms
  readonly frameWordsAdmittedAt: ReadonlyMap<string, number>
  readonly inflectionsAdmittedAt: ReadonlyMap<string, number>
  readonly cardWords: ReadonlyMap<string, LexiconEntry>
  readonly irregularVerbs: ReadonlyMap<string, IrregularForms>
}

type PassageToken = {
  readonly token: string
  readonly previous: string | undefined
  readonly next: string | undefined
  readonly haveBefore: HaveBefore
}

const haveForms: ReadonlyMap<string, HaveBefore> = new Map([
  ['have', 'have'],
  ['has', 'have'],
  ["'s", "'s"],
])

const subjectPronouns: ReadonlySet<string> = new Set(['i', 'you', 'he', 'she', 'it', 'we', 'they'])

const perfectAdverbs: ReadonlySet<string> = new Set([
  'not',
  "n't",
  'never',
  'just',
  'already',
  'ever',
])

const haveBeforeOf = (earlier: ReadonlyArray<string>): HaveBefore => {
  const [last, beforeLast] = earlier.filter((token) => !perfectAdverbs.has(token)).toReversed()
  const host = last !== undefined && subjectPronouns.has(last) ? beforeLast : last
  return (host === undefined ? undefined : haveForms.get(host)) ?? 'none'
}

const passageTokensOf = (sentence: ReadonlyArray<string>): ReadonlyArray<PassageToken> =>
  sentence.map((token, index) => ({
    token,
    previous: sentence[index - 1],
    next: sentence[index + 1],
    haveBefore: haveBeforeOf(sentence.slice(0, index)),
  }))

const termsOf = (content: GateContent): GrammarTerms => {
  const positionOf = (lessonId: string): number => lessonPositionOf(content.curriculum, lessonId)
  return {
    reading: readingTermsOf(content),
    frameWordsAdmittedAt: frameWordAdmissionsOf(content),
    inflectionsAdmittedAt: new Map(
      content.grammar.structures.flatMap(({ inflections, admittingLessonId }) =>
        inflections.map((inflection) => [inflection, positionOf(admittingLessonId)] as const),
      ),
    ),
    cardWords: new Map(content.lexicon.map((entry) => [entry.lemma, entry])),
    irregularVerbs: new Map(
      content.grammar.irregularVerbs.map(
        ({ lemma, past, pastParticiple }) => [lemma, { past, pastParticiple }] as const,
      ),
    ),
  }
}

const isAdmittedBy = (admittedAt: number | undefined, { position }: GrammarPassage): boolean =>
  admittedAt !== undefined && admittedAt <= position

const articleOf = (inflection: string): string => (/^[-aeiou]/.test(inflection) ? 'an' : 'a')

const inflectionFailures = (
  token: string,
  inflection: string,
  passage: GrammarPassage,
  terms: GrammarTerms,
): ReadonlyArray<string> => {
  const admittedAt = terms.inflectionsAdmittedAt.get(inflection)
  if (isAdmittedBy(admittedAt, passage)) {
    return []
  }
  const label =
    inflection === token ? 'an inflection' : `${articleOf(inflection)} ${inflection} inflection`
  const holding = `${passage.label}: ${passage.kind} holds ${token}, ${label}`
  return admittedAt === undefined
    ? [`${holding} no structure admits`]
    : [`${holding} admitted after ${passage.lessonId}`]
}

const frameWordFormFailures = (
  token: string,
  word: string,
  passage: GrammarPassage,
  terms: GrammarTerms,
): ReadonlyArray<string> => {
  if (token !== word) {
    return inflectionFailures(token, token, passage, terms)
  }
  return isAdmittedBy(terms.frameWordsAdmittedAt.get(word), passage)
    ? []
    : [
        `${passage.label}: ${passage.kind} holds ${token}, a frame word admitted after ${passage.lessonId}`,
      ]
}

const cardWordFailures = (
  { token, haveBefore }: PassageToken,
  entry: LexiconEntry,
  passage: GrammarPassage,
  terms: GrammarTerms,
): ReadonlyArray<string> => {
  const form = cardWordFormOf(token, entry, { irregularVerbs: terms.irregularVerbs, haveBefore })
  switch (form.kind) {
    case 'ungated':
      return []
    case 'inflected':
      return inflectionFailures(token, form.inflection, passage, terms)
    case 'unlistedPast':
      return [
        `${passage.label}: ${passage.kind} holds ${token}, a form of ${entry.lemma} the irregular verb list does not name`,
      ]
  }
}

const isContractionPiece = (token: string): boolean => token.startsWith("'") || token === "n't"

const wordOf = (
  token: string | undefined,
  passage: GrammarPassage,
  terms: GrammarTerms,
): string | undefined => {
  const reading = token === undefined ? undefined : readingOf(token, passage, terms.reading)
  return reading?.kind === 'word' ? reading.word : undefined
}

const isBeHost = (
  previous: string | undefined,
  passage: GrammarPassage,
  terms: GrammarTerms,
): boolean => {
  const word = wordOf(previous, passage, terms)
  return (
    word !== undefined &&
    (terms.frameWordsAdmittedAt.has(word) || terms.cardWords.get(word)?.partOfSpeech === 'adverb')
  )
}

const pieceFailures = (
  { token, previous }: PassageToken,
  passage: GrammarPassage,
  terms: GrammarTerms,
): ReadonlyArray<string> => {
  const isPossessive = token === "'s" && !isBeHost(previous, passage, terms)
  return inflectionFailures(token, isPossessive ? "possessive 's" : token, passage, terms)
}

const isObjectRelative = (
  { token, previous, next }: PassageToken,
  passage: GrammarPassage,
  terms: GrammarTerms,
): boolean => {
  if (token !== 'that' || next === undefined || !subjectPronouns.has(next)) {
    return false
  }
  const antecedent = wordOf(previous, passage, terms)
  return antecedent === undefined || !terms.frameWordsAdmittedAt.has(antecedent)
}

const tokenFailures = (
  passageToken: PassageToken,
  passage: GrammarPassage,
  terms: GrammarTerms,
): ReadonlyArray<string> => {
  const { token } = passageToken
  if (isContractionPiece(token)) {
    return pieceFailures(passageToken, passage, terms)
  }
  const reading = readingOf(token, passage, terms.reading)
  if (reading.kind !== 'word') {
    return []
  }
  if (isObjectRelative(passageToken, passage, terms)) {
    return inflectionFailures(token, 'object relative that', passage, terms)
  }
  if (terms.frameWordsAdmittedAt.has(reading.word)) {
    return frameWordFormFailures(token, reading.word, passage, terms)
  }
  const cardWord = terms.cardWords.get(reading.word)
  return cardWord === undefined ? [] : cardWordFailures(passageToken, cardWord, passage, terms)
}

const passageFailures = (content: GateContent): ReadonlyArray<string> => {
  const terms = termsOf(content)
  return grammarPassagesOf(content).flatMap((passage) =>
    passage.sentences.flatMap((sentence) =>
      passageTokensOf(sentence).flatMap((passageToken) =>
        tokenFailures(passageToken, passage, terms),
      ),
    ),
  )
}

export const checkGrammar = (content: GateContent): ReadonlyArray<string> => [
  ...inventoryFailuresOf(content),
  ...passageFailures(content),
]
