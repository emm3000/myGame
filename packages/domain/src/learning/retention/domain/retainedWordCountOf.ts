import type { HeldCard } from '../../domain/HeldCard'
import { isWordRetained } from './isWordRetained'

export const retainedWordCountOf = (cards: ReadonlyArray<HeldCard>): number =>
  cards.filter(isWordRetained).length
