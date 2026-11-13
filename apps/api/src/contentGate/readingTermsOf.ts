import type { LessonContentFiles } from '../adapters/json/lessonContentFilesOf'

export type ReadingTerms = {
  readonly forms: ReadonlyMap<string, ReadonlySet<string>>
  readonly offListForms: ReadonlyMap<string, string>
}

export const readingTermsOf = ({
  forms,
  lexicon,
}: Pick<LessonContentFiles, 'forms' | 'lexicon'>): ReadingTerms => ({
  forms,
  offListForms: new Map(
    lexicon
      .filter(({ isOffList }) => isOffList === true)
      .flatMap(({ lemma, acceptedForms = [] }) =>
        [lemma, ...acceptedForms].map((form) => [form.toLowerCase(), lemma.toLowerCase()] as const),
      ),
  ),
})
