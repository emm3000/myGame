import { readingOf } from '../infrastructure/json/readingOf'
import type { LexiconEntry } from '../infrastructure/json/readLessonContentFiles'
import type { GrammarPassage } from './grammarPassagesOf'
import type { GrammarTerms } from './grammarTermsOf'

export const grammarWordOf = (
  token: string | undefined,
  passage: GrammarPassage,
  terms: GrammarTerms,
): string | undefined => {
  const reading = token === undefined ? undefined : readingOf(token, passage, terms.reading)
  return reading?.kind === 'word' ? reading.word : undefined
}

export const grammarCardEntryOf = (
  token: string | undefined,
  passage: GrammarPassage,
  terms: GrammarTerms,
): LexiconEntry | undefined => {
  const word = grammarWordOf(token, passage, terms)
  return word === undefined ? undefined : terms.cardWords.get(word)
}
