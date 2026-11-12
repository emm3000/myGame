import type { NextStep } from '@mygame/contracts'

export type TownGoal = NonNullable<Extract<NextStep, { readonly kind: 'caughtUp' }>['goal']>
