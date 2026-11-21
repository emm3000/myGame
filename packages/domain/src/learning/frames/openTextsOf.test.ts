import { describe, expect, it } from 'vitest'
import { MemoryCard } from '#memory/MemoryCard'
import { Instant } from '#time/Instant'
import type { Band } from '../curriculum/BandStart'
import { inMemoryBands } from '../curriculum/testing/inMemoryBands'
import { lessonOne } from '../curriculum/testing/lessonOne'
import { unitLessonOne } from '../curriculum/testing/unitLessonOne'
import type { HeldCard } from '../HeldCard'
import type { Lesson } from '../Lesson'
import { openTextsOf } from './openTextsOf'
import type { Text } from './Text'

const enteredAt = Instant.fromEpochMilliseconds(1_794_301_200_000)

const lessonNumbered = (number: number): Lesson => ({
  ...lessonOne,
  id: `lesson-${number}`,
  words: lessonOne.words.map((word) => ({ ...word, id: `${word.id}-${number}` })),
})

const chromeLesson = lessonNumbered(1)
const firstBandOneLesson = lessonNumbered(2)
const secondBandOneLesson = lessonNumbered(3)

const curriculum = [chromeLesson, firstBandOneLesson, unitLessonOne, secondBandOneLesson]

const bands = inMemoryBands([{ band: 1, lessonIds: ['lesson-2', 'lesson-3'], words: [] }])

const textFrom = (fromLessonId: string): Text => ({
  id: `text-of-${fromLessonId}`,
  fromLessonId,
  title: 'A New Course',
  sentences: ['I live in a little old house.'],
})

const firstText = textFrom('lesson-2')
const secondText = textFrom('lesson-3')

const texts = [secondText, firstText]

const cardsOf = (...studied: ReadonlyArray<Lesson>): ReadonlyArray<HeldCard> =>
  studied.flatMap(({ words }) =>
    words.map(({ id }) => ({ wordId: id, card: MemoryCard.entered(enteredAt) })),
  )

const openTextIdsAfter = (
  cards: ReadonlyArray<HeldCard>,
  placedOutBands: ReadonlyArray<Band> = [],
): ReadonlyArray<string> =>
  openTextsOf(texts, { curriculum, cards, placedOutBands, bands }).map(({ id }) => id)

describe('openTextsOf', () => {
  it('opens a text once the stage reaches its lesson', () => {
    expect(openTextIdsAfter(cardsOf(chromeLesson))).toEqual([])
    expect(openTextIdsAfter(cardsOf(chromeLesson, firstBandOneLesson))).toEqual([firstText.id])
  })

  it('keeps every earlier text open', () => {
    const studied = cardsOf(chromeLesson, firstBandOneLesson, secondBandOneLesson)

    expect(openTextIdsAfter(studied)).toEqual([secondText.id, firstText.id])
  })

  it('opens a later lesson’s text past an unstudied unit lesson', () => {
    const studied = cardsOf(chromeLesson, firstBandOneLesson, secondBandOneLesson)

    expect(openTextIdsAfter(studied)).toEqual([secondText.id, firstText.id])
  })

  it('opens the texts of a placed-out band’s lessons', () => {
    expect(openTextIdsAfter(cardsOf(chromeLesson), [1])).toEqual([secondText.id, firstText.id])
  })
})
