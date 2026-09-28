import { accountTokensContract } from '../accountTokensContract'
import { MemoryAccountTokens } from './MemoryAccountTokens'

accountTokensContract('MemoryAccountTokens', async () => ({
  accountTokens: new MemoryAccountTokens(),
  registerPlayers: async () => {},
}))
