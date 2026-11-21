import { lemmaWordsOf } from './lemmaWordsOf'

export const isUnitLemma = (lemma: string): boolean => lemmaWordsOf(lemma).length > 1
