import { accountTokensContract } from '../accountTokensContract'
import { MemoryAccountTokens } from './MemoryAccountTokens'

accountTokensContract('MemoryAccountTokens', async () => {
  const accountTokens = new MemoryAccountTokens()
  return {
    accountTokens,
    registerPlayers: async () => {},
    issueTogether: async (first, second, now) => {
      await Promise.all([accountTokens.issue(first, now), accountTokens.issue(second, now)])
    },
  }
})
