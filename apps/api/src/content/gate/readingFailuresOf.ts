import type { Reading } from '../infrastructure/json/readingOf'

export type ReadingHolder = {
  readonly label: string
  readonly kind: 'frame' | 'text'
}

export const readingFailuresOf = (
  token: string,
  reading: Reading,
  { label, kind }: ReadingHolder,
): ReadonlyArray<string> => {
  switch (reading.kind) {
    case 'word':
      return []
    case 'unknownForm':
      return [`${label}: ${kind} holds ${token}, which no NGSL form or off-list word spells`]
    case 'unnamedHomograph':
      return [`${label}: ${kind} holds the homograph ${token} and names no word for it`]
    case 'impossibleHomograph':
      return [`${label}: names ${reading.named} for ${token}, which ${token} cannot mean`]
    default: {
      const unreachable: never = reading
      return unreachable
    }
  }
}
