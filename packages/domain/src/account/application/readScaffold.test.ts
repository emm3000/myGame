import { describe, expect, it } from 'vitest'
import { inMemoryAccounts } from '../testing/inMemoryAccounts'
import { readScaffold } from './readScaffold'

const ana = 'player-ana'

describe('readScaffold', () => {
  it('reads the scaffold the account holds', async () => {
    const accounts = inMemoryAccounts([
      {
        id: ana,
        email: 'ana@example.com',
        passwordHash: 'hash',
        emailVerified: true,
        scaffold: 'none',
        scaffoldVersion: 1,
      },
    ])

    expect(await readScaffold(ana, accounts)).toEqual({ ok: true, value: 'none' })
  })

  it('refuses a player who holds no account', async () => {
    expect(await readScaffold(ana, inMemoryAccounts())).toEqual({
      ok: false,
      error: { kind: 'AccountNotFound', playerId: ana },
    })
  })
})
