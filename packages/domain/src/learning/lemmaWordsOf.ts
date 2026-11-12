import type { Headword } from './BandStart'
import { headwordOf } from './headwordOf'

export const lemmaWordsOf = (lemma: string): ReadonlyArray<Headword> => headwordOf(lemma).split(' ')
