import type { ResourceKind, SeasonKind } from '@mygame/contracts'

export type ShownHint =
  | { readonly kind: 'peasants' }
  | { readonly kind: 'seasons'; readonly season: SeasonKind }
  | { readonly kind: 'queue' }
  | { readonly kind: 'library' }
  | { readonly kind: 'barracks' }
  | { readonly kind: 'marches' }
  | { readonly kind: 'fullStore'; readonly resource: ResourceKind }
