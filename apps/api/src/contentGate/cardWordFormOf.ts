import type { LexiconEntry } from '../adapters/json/lessonContentFilesOf'

export const cardWordInflections = [
  '-s',
  '-ed',
  '-ing',
  '-er',
  '-est',
  'plural',
  'irregular past',
  'past participle',
] as const

type CardWordInflection = (typeof cardWordInflections)[number]

export type CardWordForm =
  | { readonly kind: 'ungated' }
  | { readonly kind: 'inflected'; readonly inflection: CardWordInflection }
  | { readonly kind: 'unlistedPast' }

export type CardWordFormContext = {
  readonly irregularPasts: ReadonlyMap<string, ReadonlySet<string>>
  readonly isAfterHave: boolean
}

const ungated: CardWordForm = { kind: 'ungated' }

const inflected = (inflection: CardWordInflection): CardWordForm => ({
  kind: 'inflected',
  inflection,
})

const thirdPersonFormsOf = (lemma: string): ReadonlyArray<string> => [
  `${lemma}s`,
  `${lemma}es`,
  ...(lemma.endsWith('y') ? [`${lemma.slice(0, -1)}ies`] : []),
]

const verbFormOf = (
  form: string,
  lemma: string,
  { irregularPasts, isAfterHave }: CardWordFormContext,
): CardWordForm => {
  if (form.endsWith('ing')) {
    return inflected('-ing')
  }
  if (thirdPersonFormsOf(lemma).includes(form)) {
    return inflected('-s')
  }
  const isIrregularPast = irregularPasts.get(lemma)?.has(form) === true
  if (!isIrregularPast && !form.endsWith('ed')) {
    return { kind: 'unlistedPast' }
  }
  if (isAfterHave) {
    return inflected('past participle')
  }
  return inflected(isIrregularPast ? 'irregular past' : '-ed')
}

export const cardWordFormOf = (
  form: string,
  { lemma, partOfSpeech }: LexiconEntry,
  context: CardWordFormContext,
): CardWordForm => {
  if (form === lemma) {
    return ungated
  }
  switch (partOfSpeech) {
    case 'noun':
      return inflected('plural')
    case 'phrase':
      return ungated
    case 'verb':
      return verbFormOf(form, lemma, context)
    case 'adjective':
    case 'adverb':
      return inflected(form.endsWith('st') ? '-est' : '-er')
  }
}
