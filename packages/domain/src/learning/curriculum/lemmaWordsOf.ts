import type { Headword } from './Headword'
import { headwordOf } from './headwordOf'

export const lemmaWordsOf = (lemma: string): ReadonlyArray<Headword> => headwordOf(lemma).split(' ')
