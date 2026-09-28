import type { ArtKind } from '../ports/BuildingCatalog'
import type { Instant } from '../time/Instant'
import type { Stocks } from './Fief'

export type StudySlot =
  | { readonly kind: 'idle' }
  | {
      readonly kind: 'busy'
      readonly art: ArtKind
      readonly targetLevel: number
      readonly startedAt: Instant
      readonly finishesAt: Instant
      readonly cost: Stocks
    }

export type BusyStudySlot = Extract<StudySlot, { readonly kind: 'busy' }>
