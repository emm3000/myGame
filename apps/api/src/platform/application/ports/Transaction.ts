import type { Result } from '@mygame/domain'

export type Transaction<Stores> = <T, E>(
  work: (stores: Stores) => Promise<Result<T, E>>,
) => Promise<Result<T, E>>
