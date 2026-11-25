import { inMemoryEarnedSkills, inMemoryTowns, MemorySeenTowns } from '@mygame/domain/testing'
import { seenTownsContract } from './seenTownsContract.testSupport'

seenTownsContract('MemorySeenTowns', async () => {
  const towns = inMemoryTowns([], inMemoryEarnedSkills([]))
  const seenTowns = new MemorySeenTowns(towns)
  return {
    seenTowns,
    towns,
    registerPlayers: async () => {},
    seenAtOf: (playerId) => seenTowns.seenAtOf(playerId),
  }
})
