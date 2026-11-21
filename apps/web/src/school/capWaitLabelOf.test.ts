import { en } from '@mygame/catalog'
import { expect, it } from 'vitest'
import { knownTown } from '../auth/stubApiClient.testSupport'
import { liveTownAt } from '../town/liveTown'
import { capWaitLabelOf } from './capWaitLabelOf'

const townWithAWordDueAt = (offsetSeconds: number): ReturnType<typeof liveTownAt> =>
  liveTownAt(
    {
      ...knownTown,
      learning: {
        ...knownTown.learning,
        nextInLearningDueAt: new Date(
          Date.parse(knownTown.readAt) + offsetSeconds * 1000,
        ).toISOString(),
      },
    },
    0,
  )

it('answers no wait when the next word in learning was already due', () => {
  expect(capWaitLabelOf(en, townWithAWordDueAt(-60))).toBeNull()
})

it('answers no wait when the next word in learning is due right now', () => {
  expect(capWaitLabelOf(en, townWithAWordDueAt(0))).toBeNull()
})
