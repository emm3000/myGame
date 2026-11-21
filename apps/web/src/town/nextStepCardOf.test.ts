import { en } from '@mygame/catalog'
import { expect, it } from 'vitest'
import { reviewsActionOf } from './nextStepCardOf'

it('labels the reviews action from the catalog it is given', () => {
  expect(reviewsActionOf(en, [])).toEqual({ label: 'Start the reviews', to: '/reviews' })
})

it('labels the read-first action from the catalog it is given', () => {
  expect(reviewsActionOf(en, ['lesson-1'])).toEqual({
    label: 'Read the words',
    to: '/school/$lessonId',
    lessonId: 'lesson-1',
  })
})
