import { type FrameToken, headwordOf, lemmaWordsOf, type WordId } from '@mygame/domain'
import { readingOf } from '../../contentGate/readingOf'
import { type ReadingTerms, readingTermsOf } from '../../contentGate/readingTermsOf'
import type { LessonContentFiles, LexiconEntry } from './lessonContentFilesOf'

export type ResolvedFrames = {
  readonly tokens: ReadonlyMap<WordId, ReadonlyMap<string, ReadonlyArray<FrameToken>>>
  readonly answerForms: ReadonlyMap<WordId, ReadonlySet<string>>
}

type FrameTerms = {
  readonly reading: ReadingTerms
  readonly cardWords: ReadonlyMap<string, ReadonlyArray<WordId>>
}

type FrameText = {
  readonly entry: LexiconEntry
  readonly text: string
  readonly noCardSense: ReadonlySet<string>
}

const cardWordsOf = ({
  lessons,
}: LessonContentFiles): ReadonlyMap<string, ReadonlyArray<WordId>> => {
  const cardWords = new Map<string, ReadonlyArray<WordId>>()
  for (const { id, lemma } of lessons.flatMap(({ words }) => words)) {
    const headword = headwordOf(lemma)
    cardWords.set(headword, [...(cardWords.get(headword) ?? []), id])
  }
  return cardWords
}

const cardWordOf = (
  token: string,
  { entry, noCardSense }: FrameText,
  terms: FrameTerms,
): WordId | null => {
  if (noCardSense.has(token)) {
    return null
  }
  const reading = readingOf(token, entry, terms.reading)
  if (reading.kind !== 'word' || lemmaWordsOf(entry.lemma).includes(reading.word)) {
    return null
  }
  const [wordId, ...others] = terms.cardWords.get(reading.word) ?? []
  return wordId !== undefined && others.length === 0 ? wordId : null
}

const tokensOfText = (frame: FrameText, terms: FrameTerms): ReadonlyArray<FrameToken> => {
  const { text } = frame
  const tokens: Array<FrameToken> = []
  let at = 0
  for (const { 0: form, index } of text.matchAll(/[a-z]+/gi)) {
    const wordId = cardWordOf(form.toLowerCase(), frame, terms)
    if (wordId === null) {
      continue
    }
    const between = text.slice(at, index)
    tokens.push(...(between === '' ? [] : [{ text: between, wordId: null }]), {
      text: form,
      wordId,
    })
    at = index + form.length
  }
  return at < text.length ? [...tokens, { text: text.slice(at), wordId: null }] : tokens
}

const framesOfEntry = (
  entry: LexiconEntry,
  terms: FrameTerms,
): ReadonlyMap<string, ReadonlyArray<FrameToken>> =>
  new Map(
    entry.frames.flatMap(({ frame, gappedFrame, noCardSense = [] }) =>
      [frame, gappedFrame].map(
        (text) =>
          [text, tokensOfText({ entry, text, noCardSense: new Set(noCardSense) }, terms)] as const,
      ),
    ),
  )

const formsByHeadwordOf = (
  forms: ReadonlyMap<string, ReadonlySet<string>>,
): ReadonlyMap<string, ReadonlySet<string>> => {
  const formsByHeadword = new Map<string, Set<string>>()
  for (const [form, headwords] of forms) {
    for (const headword of headwords) {
      formsByHeadword.set(headword, new Set([...(formsByHeadword.get(headword) ?? []), form]))
    }
  }
  return formsByHeadword
}

const answerFormsOfEntry = (
  { lemma, acceptedForms = [] }: LexiconEntry,
  formsByHeadword: ReadonlyMap<string, ReadonlySet<string>>,
): ReadonlySet<string> =>
  new Set(
    [lemma, ...acceptedForms]
      .flatMap((form) => lemmaWordsOf(form))
      .flatMap((word) => [word, ...(formsByHeadword.get(word) ?? [])]),
  )

export const resolvedFramesOf = (files: LessonContentFiles): ResolvedFrames => {
  const terms = { reading: readingTermsOf(files), cardWords: cardWordsOf(files) }
  const formsByHeadword = formsByHeadwordOf(files.forms)
  const entries = files.lessons.flatMap(({ words }) => words)
  return {
    tokens: new Map(entries.map((entry) => [entry.id, framesOfEntry(entry, terms)])),
    answerForms: new Map(
      entries.map((entry) => [entry.id, answerFormsOfEntry(entry, formsByHeadword)]),
    ),
  }
}
