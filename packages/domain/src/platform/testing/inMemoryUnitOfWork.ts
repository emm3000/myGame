import type { UnitOfWork } from '../domain/UnitOfWork'

export const inMemoryUnitOfWork = <Stores>(stores: Stores): UnitOfWork<Stores> => ({
  transact: (work) => work(stores),
})
