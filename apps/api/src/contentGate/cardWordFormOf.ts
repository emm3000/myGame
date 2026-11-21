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

export type IrregularForms = {
  readonly past: string
  readonly pastParticiple: string
}

export type CardWordFormContext = {
  readonly irregularVerbs: ReadonlyMap<string, IrregularForms>
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
  { irregularVerbs, isAfterHave }: CardWordFormContext,
): CardWordForm => {
  if (form.endsWith('ing')) {
    return inflected('-ing')
  }
  if (thirdPersonFormsOf(lemma).includes(form)) {
    return inflected('-s')
  }
  const irregular = irregularVerbs.get(lemma)
  const isPast = irregular?.past === form
  const isParticiple = irregular?.pastParticiple === form
  const isRegularPast = form !== lemma && form.endsWith('ed')
  if (isAfterHave && (isPast || isParticiple || isRegularPast)) {
    return inflected('past participle')
  }
  if (form === lemma) {
    return ungated
  }
  if (isPast) {
    return inflected('irregular past')
  }
  if (isParticiple) {
    return inflected('past participle')
  }
  return isRegularPast ? inflected('-ed') : { kind: 'unlistedPast' }
}

export const cardWordFormOf = (
  form: string,
  { lemma, partOfSpeech }: LexiconEntry,
  context: CardWordFormContext,
): CardWordForm => {
  if (partOfSpeech === 'verb') {
    return verbFormOf(form, lemma, context)
  }
  if (form === lemma) {
    return ungated
  }
  switch (partOfSpeech) {
    case 'noun':
      return inflected('plural')
    case 'phrase':
      return ungated
    case 'adjective':
    case 'adverb':
      return inflected(form.endsWith('st') ? '-est' : '-er')
  }
}
