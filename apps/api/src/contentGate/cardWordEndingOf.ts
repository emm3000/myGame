import type { LexiconEntry } from '../adapters/json/lessonContentFilesOf'

export const cardWordEndings = ['-s', '-ed', '-ing', '-er', '-est'] as const

type CardWordEnding = (typeof cardWordEndings)[number]

const thirdPersonFormsOf = (lemma: string): ReadonlyArray<string> => [
  `${lemma}s`,
  `${lemma}es`,
  ...(lemma.endsWith('y') ? [`${lemma.slice(0, -1)}ies`] : []),
]

const verbEndingOf = (form: string, lemma: string): CardWordEnding => {
  if (form.endsWith('ing')) {
    return '-ing'
  }
  return thirdPersonFormsOf(lemma).includes(form) ? '-s' : '-ed'
}

export const cardWordEndingOf = (
  form: string,
  { lemma, partOfSpeech }: LexiconEntry,
): CardWordEnding | undefined => {
  if (form === lemma) {
    return undefined
  }
  switch (partOfSpeech) {
    case 'noun':
      return undefined
    case 'verb':
      return verbEndingOf(form, lemma)
    case 'adjective':
    case 'adverb':
      return form.endsWith('st') ? '-est' : '-er'
    default: {
      const unreachable: never = partOfSpeech
      return unreachable
    }
  }
}
