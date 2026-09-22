import type { Player } from '@mygame/contracts'
import type { ApiClient } from '../api/apiClient'

export const knownPlayer: Player = {
  id: '4f7c1c2e-8a4b-4d1e-9f3a-2b6c8d0e1f2a',
  email: 'aldonza@example.com',
}

export const stubApiClient = (overrides: Partial<ApiClient> = {}): ApiClient => ({
  signUp: async () => ({ ok: true, value: knownPlayer }),
  signIn: async () => ({ ok: true, value: knownPlayer }),
  signOut: async () => ({ ok: true, value: undefined }),
  currentPlayer: async () => undefined,
  ...overrides,
})
