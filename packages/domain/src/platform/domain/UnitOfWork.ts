import type { Result } from '#Result'

export interface UnitOfWork<Stores> {
  transact<T, E>(work: (stores: Stores) => Promise<Result<T, E>>): Promise<Result<T, E>>
}
