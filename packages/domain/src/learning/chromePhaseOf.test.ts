import { assert, describe, expect, it } from 'vitest'
import { MemoryCard, type StoredMemoryCard } from '../memory/MemoryCard'
import { lessonOne } from '../testing/lessonOne'
import { unitLessonOne } from '../testing/unitLessonOne'
import { Instant } from '../time/Instant'
import { chromePhaseOf } from './chromePhaseOf'
import type { HeldCard } from './HeldCard'
import type { Lesson } from './Lesson'

const instantAt = (iso: string): Instant => Instant.fromEpochMilliseconds(Date.parse(iso))

const enteredAt = instantAt('2026-11-10T09:00:00Z')

const chromeLessons: ReadonlyArray<Lesson> = [lessonOne, { ...unitLessonOne, id: 'lesson-2' }]

const cardAt = (stability: number): MemoryCard => {
  const stored = {
    state: 'review',
    step: null,
    stability,
    difficulty: 2.0975,
    lastReviewAt: instantAt('2026-11-23T09:10:00Z'),
    lastRating: 'good',
    enteredAt,
    retainedAt: null,
  } as StoredMemoryCard
  const card = MemoryCard.restore(stored)
  assert(card.ok)
  return card.value
}

const cardsOf = (lesson: Lesson, card: MemoryCard): ReadonlyArray<HeldCard> =>
  lesson.words.map(({ id }) => ({ wordId: id, card }))

const [firstLesson, secondLesson] = chromeLessons

const studiedFirst = firstLesson === undefined ? [] : cardsOf(firstLesson, cardAt(9))

const studiedBoth =
  secondLesson === undefined ? studiedFirst : [...studiedFirst, ...cardsOf(secondLesson, cardAt(9))]

const lapsedBoth = chromeLessons.flatMap((lesson) => cardsOf(lesson, cardAt(1.2)))

const skillOf = (lessonId: string): { readonly lessonId: string } => ({ lessonId })

describe('chromePhaseOf', () => {
  it('keeps the chrome Spanish until every chrome lesson is studied', () => {
    expect([
      chromePhaseOf('es', chromeLessons, [], []),
      chromePhaseOf('es', chromeLessons, studiedFirst, [skillOf('lesson-1')]),
    ]).toEqual(['scaffold', 'scaffold'])
  })

  it('turns the chrome to both once every chrome lesson is studied', () => {
    expect(chromePhaseOf('es', chromeLessons, studiedBoth, [skillOf('lesson-1')])).toBe('both')
  })

  it('turns the chrome to English once every chrome lesson skill is earned', () => {
    const skills = [skillOf('lesson-1'), skillOf('lesson-2')]

    expect(chromePhaseOf('es', chromeLessons, studiedBoth, skills)).toBe('english')
  })

  it('never moves the chrome phase back', () => {
    const skills = [skillOf('lesson-1'), skillOf('lesson-2')]

    expect([
      chromePhaseOf('es', chromeLessons, lapsedBoth, skills),
      chromePhaseOf('es', chromeLessons, lapsedBoth, [skillOf('lesson-1')]),
    ]).toEqual(['english', 'both'])
  })

  it('draws the chrome in English from the start under none', () => {
    expect(chromePhaseOf('none', chromeLessons, [], [])).toBe('english')
  })
})
