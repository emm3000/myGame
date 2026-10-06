import { seenHintsContract } from '../seenHintsContract'
import { MemorySeenHints } from './MemorySeenHints'

seenHintsContract('MemorySeenHints', async () => ({
  seenHints: new MemorySeenHints(),
  registerPlayers: async () => {},
}))
