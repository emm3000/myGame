import { isUnitLemma } from '@mygame/domain'
import type { LexiconEntry } from './readLessonContentFiles'

export const isUnit = ({ lemma }: LexiconEntry): boolean => isUnitLemma(lemma)
