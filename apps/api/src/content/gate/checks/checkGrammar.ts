import { headwordOf } from '@mygame/domain'
import { readingOf } from '../../infrastructure/json/readingOf'
import { type ReadingTerms, readingTermsOf } from '../../infrastructure/json/readingTermsOf'
import type { LexiconEntry } from '../../infrastructure/json/readLessonContentFiles'
import type { HaveBefore, IrregularForms } from '../CardWordFormContext'
import { cardWordFormOf } from '../cardWordFormOf'
import { clauseLinkingStructures } from '../clauseLinkingStructures'
import { frameWordAdmissionsOf } from '../frameWordAdmissionsOf'
import type { GateContent } from '../GateContent'
import { type GrammarPassage, grammarPassagesOf } from '../grammarPassagesOf'
import { haveBeforeOf, type SubjectWords } from '../haveBeforeOf'
import { inventoryFailuresOf } from '../inventoryFailuresOf'
import { lessonPositionOf } from '../lessonPositionOf'
import { subjectPronouns } from '../subjectPronouns'

type GrammarTerms = {
  readonly reading: ReadingTerms
  readonly frameWordsAdmittedAt: ReadonlyMap<string, number>
  readonly clauseLinkingWords: ReadonlySet<string>
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

const termsOf = (content: GateContent): GrammarTerms => {
  const positionOf = (lessonId: string): number => lessonPositionOf(content.curriculum, lessonId)
  return {
    reading: readingTermsOf(content),
    frameWordsAdmittedAt: frameWordAdmissionsOf(content),
    clauseLinkingWords: new Set(
      content.grammar.structures
        .filter(({ name }) => clauseLinkingStructures.has(name))
        .flatMap(({ frameWords }) => frameWords.map((word) => headwordOf(word))),
    ),
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

const cardEntryOf = (
  token: string | undefined,
  passage: GrammarPassage,
  terms: GrammarTerms,
): LexiconEntry | undefined => {
  const word = wordOf(token, passage, terms)
  return word === undefined ? undefined : terms.cardWords.get(word)
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

const isVerbForm = (
  token: string | undefined,
  passage: GrammarPassage,
  terms: GrammarTerms,
): boolean => {
  const entry = cardEntryOf(token, passage, terms)
  return entry?.partOfSpeech === 'verb' && token !== entry.lemma
}

const pieceFailures = (
  { token, previous, next }: PassageToken,
  passage: GrammarPassage,
  terms: GrammarTerms,
): ReadonlyArray<string> => {
  const isPossessive =
    token === "'s" && !isBeHost(previous, passage, terms) && !isVerbForm(next, passage, terms)
  return inflectionFailures(token, isPossessive ? "possessive 's" : token, passage, terms)
}

const isAntecedent = (word: string, terms: GrammarTerms): boolean =>
  !terms.clauseLinkingWords.has(word) && terms.cardWords.get(word)?.partOfSpeech !== 'adverb'

const isObjectRelative = (
  { token, previous, next }: PassageToken,
  passage: GrammarPassage,
  terms: GrammarTerms,
): boolean => {
  if (
    token !== 'that' ||
    previous === undefined ||
    next === undefined ||
    !subjectPronouns.has(next)
  ) {
    return false
  }
  const antecedent = wordOf(previous, passage, terms)
  return antecedent === undefined || isAntecedent(antecedent, terms)
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

const subjectWordsOf = (passage: GrammarPassage, terms: GrammarTerms): SubjectWords => ({
  isNoun: (token) => cardEntryOf(token, passage, terms)?.partOfSpeech === 'noun',
  isFrameWord: (token) => {
    const word = wordOf(token, passage, terms)
    return word !== undefined && terms.frameWordsAdmittedAt.has(word)
  },
})

const passageTokensOf = (
  sentence: ReadonlyArray<string>,
  subjectWords: SubjectWords,
): ReadonlyArray<PassageToken> =>
  sentence.map((token, index) => ({
    token,
    previous: sentence[index - 1],
    next: sentence[index + 1],
    haveBefore: haveBeforeOf(sentence.slice(0, index), subjectWords),
  }))

const passageFailures = (content: GateContent): ReadonlyArray<string> => {
  const terms = termsOf(content)
  return grammarPassagesOf(content).flatMap((passage) =>
    passage.sentences.flatMap((sentence) =>
      passageTokensOf(sentence, subjectWordsOf(passage, terms)).flatMap((passageToken) =>
        tokenFailures(passageToken, passage, terms),
      ),
    ),
  )
}

export const checkGrammar = (content: GateContent): ReadonlyArray<string> => [
  ...inventoryFailuresOf(content),
  ...passageFailures(content),
]
