import type { HireKind } from './HireKind'

export type Hires = Readonly<Record<HireKind, number>>

export const noHires: Hires = { worker: 0, truck: 0 }

export const hiresPlus = (hires: Hires, hire: HireKind, count: number): Hires => ({
  ...hires,
  [hire]: hires[hire] + count,
})
