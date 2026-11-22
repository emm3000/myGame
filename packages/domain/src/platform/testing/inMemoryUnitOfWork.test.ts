import { describe, expect, it } from 'vitest'
import { err, ok } from '#Result'
import { inMemoryUnitOfWork } from './inMemoryUnitOfWork'

describe('inMemoryUnitOfWork', () => {
  it('hands the work the stores it was given', async () => {
    const heldStores = { names: ['Ana'] }

    const answered = await inMemoryUnitOfWork(heldStores).transact(async (stores) =>
      ok(stores === heldStores),
    )

    expect(answered).toEqual(ok(true))
  })

  it('answers the refusal of a refused work', async () => {
    const refused = await inMemoryUnitOfWork({}).transact(async () => err('refused'))

    expect(refused).toEqual(err('refused'))
  })
})
