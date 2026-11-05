import type { LexiconEntry } from '../adapters/json/lessonContentFilesOf'
import type { ReadingTerms } from './readingTermsOf'

export type Reading =
  | { readonly kind: 'word'; readonly word: string }
  | { readonly kind: 'unknownForm' }
  | { readonly kind: 'unnamedHomograph' }
  | { readonly kind: 'impossibleHomograph'; readonly named: string }

export const readingOf = (token: string, entry: LexiconEntry, terms: ReadingTerms): Reading => {
  const offList = terms.offListForms.get(token)
  const candidates = new Set([
    ...(terms.forms.get(token) ?? []),
    ...(offList === undefined ? [] : [offList]),
  ])
  const named = entry.homographs?.[token]
  if (named !== undefined) {
    return candidates.has(named)
      ? { kind: 'word', word: named }
      : { kind: 'impossibleHomograph', named }
  }
  const [word, ...others] = candidates
  if (word === undefined) {
    return { kind: 'unknownForm' }
  }
  return others.length > 0 ? { kind: 'unnamedHomograph' } : { kind: 'word', word }
}
