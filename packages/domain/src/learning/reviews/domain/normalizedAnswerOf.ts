export const normalizedAnswerOf = (answer: string): string =>
  answer.normalize('NFC').replaceAll('’', "'").trim().replace(/\s+/g, ' ').toLowerCase()
