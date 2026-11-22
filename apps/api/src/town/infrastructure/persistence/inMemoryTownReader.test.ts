import { Instant } from '@mygame/domain'
import {
  inMemoryAccounts,
  inMemoryBandStarts,
  inMemoryCards,
  inMemoryEarnedSkills,
  inMemoryLessonSlots,
  inMemoryPlacements,
  inMemoryTownReader,
  inMemoryTowns,
  MemoryGuidanceDismissals,
  MemorySeenTips,
} from '@mygame/domain/testing'
import { townReaderContract } from './townReaderContract.testSupport'

const signedUpAt = Instant.fromEpochMilliseconds(Date.parse('2026-11-04T08:00:00Z'))

townReaderContract('inMemoryTownReader', async () => {
  const accounts = inMemoryAccounts()
  const towns = inMemoryTowns([], inMemoryEarnedSkills([]))
  const lessonSlots = inMemoryLessonSlots([])
  const placements = inMemoryPlacements([])
  const guidanceDismissals = new MemoryGuidanceDismissals(towns)
  const seenTips = new MemorySeenTips()
  return {
    reader: inMemoryTownReader({
      accounts,
      towns,
      lessonSlots,
      cards: inMemoryCards([]),
      bandStarts: inMemoryBandStarts([]),
      placements,
      guidanceDismissals,
      seenTips,
    }),
    accounts,
    towns,
    lessonSlots,
    recordPlacementScores: async (playerId, scores) => {
      await placements.save(playerId, { kind: 'taken', begunAt: signedUpAt, samples: [], scores })
    },
    guidanceDismissals,
    seenTips,
    registerPlayers: async (playerIds) => {
      for (const id of playerIds) {
        await accounts.addPlayer({
          id,
          email: `${id}@example.com`,
          passwordHash: 'argon2id-hash',
          createdAt: signedUpAt,
          scaffold: 'es',
        })
      }
    },
  }
})
