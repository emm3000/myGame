import type { LexiconEntry } from '../infrastructure/json/readLessonContentFiles'

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

export type HaveBefore = 'none' | 'have' | "'s"

export type CardWordFormContext = {
  readonly irregularVerbs: ReadonlyMap<string, IrregularForms>
  readonly haveBefore: HaveBefore
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
  { irregularVerbs, haveBefore }: CardWordFormContext,
): CardWordForm => {
  const isAfterHave = haveBefore !== 'none'
  const irregular = irregularVerbs.get(lemma)
  const isParticiple = irregular?.pastParticiple === form
  if (form === lemma) {
    return isAfterHave && isParticiple ? inflected('past participle') : ungated
  }
  if (form.endsWith('ing')) {
    return inflected('-ing')
  }
  if (thirdPersonFormsOf(lemma).includes(form)) {
    return inflected('-s')
  }
  const isPast = irregular?.past === form
  const isRegularPast = form.endsWith('ed')
  const isRegularParticiple = isRegularPast && haveBefore === 'have'
  if (isAfterHave && (isPast || isParticiple || isRegularParticiple)) {
    return inflected('past participle')
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
