import type { TextsContent } from '@mygame/contracts'
import { type FrameToken, headwordOf, lemmaWordsOf, type TextId, type WordId } from '@mygame/domain'
import { readingOf } from '../../contentGate/readingOf'
import { type ReadingTerms, readingTermsOf } from '../../contentGate/readingTermsOf'
import type { LessonContentFiles, LexiconEntry } from './lessonContentFilesOf'

type PassageTokens = ReadonlyMap<string, ReadonlyArray<FrameToken>>

export type ResolvedFrames = {
  readonly tokens: ReadonlyMap<WordId, PassageTokens>
  readonly textTokens: ReadonlyMap<TextId, PassageTokens>
  readonly answerForms: ReadonlyMap<WordId, ReadonlySet<string>>
}

type FrameTerms = {
  readonly reading: ReadingTerms
  readonly cardWords: ReadonlyMap<string, ReadonlyArray<WordId>>
}

type Passage = {
  readonly text: string
  readonly homographs: LexiconEntry['homographs']
  readonly ownWords: ReadonlyArray<string>
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
  { homographs, ownWords, noCardSense }: Passage,
  terms: FrameTerms,
): WordId | null => {
  if (noCardSense.has(token)) {
    return null
  }
  const reading = readingOf(token, { homographs }, terms.reading)
  if (reading.kind !== 'word' || ownWords.includes(reading.word)) {
    return null
  }
  const [wordId, ...others] = terms.cardWords.get(reading.word) ?? []
  return wordId !== undefined && others.length === 0 ? wordId : null
}

const tokensOfPassage = (passage: Passage, terms: FrameTerms): ReadonlyArray<FrameToken> => {
  const { text } = passage
  const tokens: Array<FrameToken> = []
  let at = 0
  for (const { 0: form, index } of text.matchAll(/[a-z]+/gi)) {
    const wordId = cardWordOf(form.toLowerCase(), passage, terms)
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

const framesOfEntry = (entry: LexiconEntry, terms: FrameTerms): PassageTokens =>
  new Map(
    entry.frames.flatMap(({ frame, gappedFrame, noCardSense = [] }) =>
      [frame, gappedFrame].map((text) => {
        const passage = {
          text,
          homographs: entry.homographs,
          ownWords: lemmaWordsOf(entry.lemma),
          noCardSense: new Set(noCardSense),
        }
        return [text, tokensOfPassage(passage, terms)] as const
      }),
    ),
  )

const passagesOfText = (
  { sentences, homographs, noCardSense = [] }: TextsContent[number],
  terms: FrameTerms,
): PassageTokens =>
  new Map(
    sentences.map((text) => {
      const passage = { text, homographs, ownWords: [], noCardSense: new Set(noCardSense) }
      return [text, tokensOfPassage(passage, terms)] as const
    }),
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
    textTokens: new Map(files.texts.map((text) => [text.id, passagesOfText(text, terms)])),
    answerForms: new Map(
      entries.map((entry) => [entry.id, answerFormsOfEntry(entry, formsByHeadword)]),
    ),
  }
}
