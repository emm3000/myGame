import { headwordOf } from '@mygame/domain'

export const lemmaWordsOf = (lemma: string): ReadonlyArray<string> => headwordOf(lemma).split(' ')
