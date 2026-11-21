import type { HireKind } from './HireKind'

export type Hires = Readonly<Record<HireKind, number>>

export const noHires: Hires = { worker: 0, truck: 0 }
