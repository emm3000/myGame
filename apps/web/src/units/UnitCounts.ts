import type { FiefEvent } from '@mygame/contracts'

export type UnitCounts = Extract<FiefEvent, { readonly kind: 'battleFought' }>['unitsLost']
