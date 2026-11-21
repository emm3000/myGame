import { expect, it } from 'vitest'
import { playerCopyOf } from '../copy/playerCopyOf'
import { reviewsActionOf } from './nextStepCardOf'

const noScaffold = playerCopyOf({ scaffold: 'none', chromePhase: 'english' })

it('labels the reviews action from the copy it is given', () => {
  expect(reviewsActionOf(noScaffold, [])).toEqual({
    label: { text: 'Start the reviews', language: 'en', translation: null },
    to: '/reviews',
  })
})

it('labels the read-first action from the copy it is given', () => {
  expect(reviewsActionOf(noScaffold, ['lesson-1'])).toEqual({
    label: { text: 'Read the words', language: 'en', translation: null },
    to: '/school/$lessonId',
    lessonId: 'lesson-1',
  })
})
