import { isUnitLemma } from '@mygame/domain'
import type { LexiconEntry } from '../adapters/json/lessonContentFilesOf'

export const isUnit = ({ lemma }: LexiconEntry): boolean => isUnitLemma(lemma)
