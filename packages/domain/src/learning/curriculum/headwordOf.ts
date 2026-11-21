import type { Headword } from './Headword'

export const headwordOf = (lemma: string): Headword => lemma.toLowerCase()
