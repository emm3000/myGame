import type { LexiconEntry } from '../adapters/json/lessonContentFilesOf'
import { lemmaWordsOf } from './lemmaWordsOf'

export const isUnit = ({ lemma }: LexiconEntry): boolean => lemmaWordsOf(lemma).length > 1
