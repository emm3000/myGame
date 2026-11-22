import { headwordOf } from '@mygame/domain'
import { type ReadingTerms, readingTermsOf } from '../infrastructure/json/readingTermsOf'
import type { LexiconEntry } from '../infrastructure/json/readLessonContentFiles'
import type { IrregularForms } from './CardWordFormContext'
import { clauseLinkingStructures } from './clauseLinkingStructures'
import { frameWordAdmissionsOf } from './frameWordAdmissionsOf'
import type { GateContent } from './GateContent'
import { lessonPositionOf } from './lessonPositionOf'

export type GrammarTerms = {
  readonly reading: ReadingTerms
  readonly frameWordsAdmittedAt: ReadonlyMap<string, number>
  readonly clauseLinkingWords: ReadonlySet<string>
  readonly inflectionsAdmittedAt: ReadonlyMap<string, number>
  readonly cardWords: ReadonlyMap<string, LexiconEntry>
  readonly irregularVerbs: ReadonlyMap<string, IrregularForms>
}

export const grammarTermsOf = (content: GateContent): GrammarTerms => {
  const positionOf = (lessonId: string): number => lessonPositionOf(content.curriculum, lessonId)
  return {
    reading: readingTermsOf(content),
    frameWordsAdmittedAt: frameWordAdmissionsOf(content),
    clauseLinkingWords: new Set(
      content.grammar.structures
        .filter(({ name }) => clauseLinkingStructures.has(name))
        .flatMap(({ frameWords }) => frameWords.map((word) => headwordOf(word))),
    ),
    inflectionsAdmittedAt: new Map(
      content.grammar.structures.flatMap(({ inflections, admittingLessonId }) =>
        inflections.map((inflection) => [inflection, positionOf(admittingLessonId)] as const),
      ),
    ),
    cardWords: new Map(content.lexicon.map((entry) => [entry.lemma, entry])),
    irregularVerbs: new Map(
      content.grammar.irregularVerbs.map(
        ({ lemma, past, pastParticiple }) => [lemma, { past, pastParticiple }] as const,
      ),
    ),
  }
}
