import type { JobCleanUp } from './Job'

export const coversWaste = ({ strength, waste }: Pick<JobCleanUp, 'strength' | 'waste'>): boolean =>
  strength >= waste
