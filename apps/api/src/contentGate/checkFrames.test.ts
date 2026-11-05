import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import type { LexiconEntry } from '../adapters/json/lessonContentFilesOf'
import { checkFrames } from './checkFrames'
import {
  contentOf,
  entryOf,
  lessonOneFrameWords,
  lessonOneInflections,
  lessonOneLexicon,
  structureOf,
} from './contentGate.testSupport'
import { gateContentOf } from './gateContentOf'

const shippedContent = fileURLToPath(new URL('../../content/', import.meta.url))

const lessonOneIds = lessonOneLexicon.map(({ id }) => id)

const withHomeFrame = (frame: string, gappedFrame = frame.replace('home', '____')) =>
  contentOf({
    lexicon: [entryOf('lesson-1-1', 'home', frame, { gappedFrame }), ...lessonOneLexicon.slice(1)],
  })

const afterLessonOne = (...laterLessons: ReadonlyArray<LexiconEntry>) =>
  contentOf({
    lexicon: [...lessonOneLexicon, ...laterLessons],
    lessons: [
      ['lesson-1', lessonOneIds],
      ...laterLessons.map(({ id }, index) => [`lesson-${index + 2}`, [id]] as const),
    ],
  })

const leave = entryOf('word-1', 'leave', 'We leave home.', { partOfSpeech: 'verb' })

const newAfterLeaving = (homographs?: Record<string, string>): LexiconEntry =>
  entryOf('word-2', 'new', 'We left my new home.', {
    partOfSpeech: 'adjective',
    ...(homographs === undefined ? {} : { homographs }),
  })

describe('content gate check 3, the frame rule', () => {
  it('passes the shipped frames', () => {
    expect(checkFrames(gateContentOf(shippedContent))).toEqual([])
  })

  it('passes a frame holding an inflected card word of an earlier lesson', () => {
    const newHomes = entryOf('word-1', 'new', 'We have new homes.', { partOfSpeech: 'adjective' })

    expect(checkFrames(afterLessonOne(newHomes))).toEqual([])
  })

  it('passes a frame holding its off-list lemma', () => {
    const password = entryOf('word-1', 'password', 'This is my password.', { isOffList: true })

    expect(checkFrames(afterLessonOne(password))).toEqual([])
  })

  it('fails a frame holding a word no earlier lesson teaches', () => {
    expect(checkFrames(withHomeFrame('This is my new home.'))).toEqual([
      'lesson-1-1: frame holds new, a word no earlier lesson teaches',
    ])
  })

  it('fails a frame holding a frame word admitted after its lesson', () => {
    const structures = [
      structureOf(
        'lesson-1',
        lessonOneFrameWords.filter((word) => word !== 'much'),
        lessonOneInflections,
      ),
      structureOf('lesson-2', ['much']),
    ]
    const newHome = entryOf('word-1', 'new', 'This is my new home.', { partOfSpeech: 'adjective' })
    const content = afterLessonOne(newHome)

    expect(checkFrames({ ...content, grammar: contentOf({ structures }).grammar })).toEqual([
      'lesson-1-4: frame holds much, a frame word admitted after lesson-1',
    ])
  })

  it('fails a frame holding a form the NGSL teaching list does not know', () => {
    expect(checkFrames(withHomeFrame('This is my home, sir.'))).toEqual([
      'lesson-1-1: frame holds sir, which no NGSL form or off-list word spells',
    ])
  })

  it('fails a frame that holds its lemma twice', () => {
    expect(checkFrames(withHomeFrame('This home is my home.'))).toEqual([
      'lesson-1-1: frame holds home 2 times, not once',
    ])
  })

  it('fails a frame without its lemma', () => {
    expect(checkFrames(withHomeFrame('This is not.'))).toEqual([
      'lesson-1-1: frame holds home 0 times, not once',
    ])
  })

  it('fails a frame holding its lemma in another form', () => {
    expect(checkFrames(withHomeFrame('We have homes.'))).toEqual([
      'lesson-1-1: frame holds home as homes, not in its own form',
    ])
  })

  it('fails a gapped frame that is not its frame with the lemma replaced by ____', () => {
    expect(checkFrames(withHomeFrame('This is my home.', 'This is ____ home.'))).toEqual([
      'lesson-1-1: gapped frame is not its frame with home replaced by ____',
    ])
  })

  it('fails a homograph form that names no word', () => {
    expect(checkFrames(afterLessonOne(leave, newAfterLeaving()))).toEqual([
      'word-2: frame holds the homograph left and names no word for it',
    ])
  })

  it('passes a homograph form that names the word it means', () => {
    expect(checkFrames(afterLessonOne(leave, newAfterLeaving({ left: 'leave' })))).toEqual([])
  })

  it('fails a homograph form that names a word it cannot mean', () => {
    expect(checkFrames(afterLessonOne(leave, newAfterLeaving({ left: 'right' })))).toEqual([
      'word-2: names right for left, which left cannot mean',
    ])
  })
})
