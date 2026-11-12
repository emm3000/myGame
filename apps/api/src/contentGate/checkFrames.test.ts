import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import type { LexiconEntry } from '../adapters/json/lessonContentFilesOf'
import { checkFrames } from './checkFrames'
import {
  contentOf,
  entryOf,
  laterFrameOf,
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

const workOn = (frame: string, gappedFrame?: string): LexiconEntry =>
  entryOf('unit-1', 'work on', frame, {
    partOfSpeech: 'verb',
    source: 'phave',
    ...(gappedFrame === undefined ? {} : { gappedFrame }),
  })

const newAtHome = entryOf('word-2', 'new', 'My home is new.', { partOfSpeech: 'adjective' })

const homeWithLaterFrame = (
  laterFrame: ReturnType<typeof laterFrameOf>,
  secondLesson: LexiconEntry = leave,
) =>
  contentOf({
    lexicon: [
      entryOf('lesson-1-1', 'home', 'This is my home.', { laterFrames: [laterFrame] }),
      ...lessonOneLexicon.slice(1),
      secondLesson,
      newAtHome,
    ],
    lessons: [
      ['lesson-1', lessonOneIds],
      ['lesson-2', [secondLesson.id]],
      ['lesson-3', [newAtHome.id]],
    ],
  })

const theAdmittedAtLessonThree = contentOf({
  structures: [
    structureOf(
      'lesson-1',
      lessonOneFrameWords.filter((word) => word !== 'the'),
      lessonOneInflections,
    ),
    structureOf('lesson-3', ['the']),
  ],
}).grammar

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
  it('passes a frame holding its unit once, together and in its own form, a gap for each word', () => {
    expect(
      checkFrames(afterLessonOne(workOn('We work on the food.', 'We ____ ____ the food.'))),
    ).toEqual([])
  })

  it('fails a gapped frame with one gap for a two-word unit', () => {
    expect(
      checkFrames(afterLessonOne(workOn('We work on the food.', 'We ____ the food.'))),
    ).toEqual(['unit-1: gapped frame is not its frame with work on replaced by ____ ____'])
  })

  it('fails a frame that holds its unit twice', () => {
    const twice = workOn('We work on, work on the food.', 'We ____ ____, work on the food.')

    expect(checkFrames(afterLessonOne(twice))).toEqual([
      'unit-1: frame holds work on 2 times, not once',
    ])
  })

  it('fails a frame that splits its unit around its object', () => {
    const split = workOn('They work for us on the food.', 'They ____ for us ____ the food.')

    expect(checkFrames(afterLessonOne(split))).toEqual([
      'unit-1: frame holds work on 0 times, not once',
    ])
  })

  it('fails a frame that splits its unit with punctuation', () => {
    const punctuated = workOn('We work, on the food.', 'We work, on the food.')

    expect(checkFrames(afterLessonOne(punctuated))).toEqual([
      'unit-1: frame holds work on with its words apart, not together',
    ])
  })

  it('fails a frame holding its unit in another form', () => {
    const inflected = workOn('We worked on the food.', 'We ____ ____ the food.')

    expect(checkFrames(afterLessonOne(inflected))).toEqual([
      'unit-1: frame holds work on as worked on, not in its own form',
    ])
  })

  it('passes a later frame holding a card word taught before the lesson it is written for', () => {
    const content = homeWithLaterFrame(laterFrameOf('home', 'We leave my home.', 'lesson-3'))

    expect(checkFrames(content)).toEqual([])
  })

  it('fails a later frame holding a card word the lesson it is written for teaches', () => {
    const content = homeWithLaterFrame(laterFrameOf('home', 'We leave my home.', 'lesson-2'))

    expect(checkFrames(content)).toEqual([
      'lesson-1-1, later frame for lesson-2: frame holds leave, a word no earlier lesson teaches',
    ])
  })

  it('passes a later frame holding a frame word the lesson it is written for admits', () => {
    const content = homeWithLaterFrame(laterFrameOf('home', 'The home is for you.', 'lesson-3'))

    expect(checkFrames({ ...content, grammar: theAdmittedAtLessonThree })).toEqual([])
  })

  it('fails a later frame holding a frame word admitted after the lesson it is written for', () => {
    const content = homeWithLaterFrame(laterFrameOf('home', 'The home is for you.', 'lesson-2'))

    expect(checkFrames({ ...content, grammar: theAdmittedAtLessonThree })).toEqual([
      'lesson-1-1, later frame for lesson-2: frame holds the, a frame word admitted after lesson-2',
    ])
  })

  it('fails a later frame whose gapped frame is not it with the lemma replaced by ____', () => {
    const ungapped = { ...laterFrameOf('home', 'We leave my home.', 'lesson-3'), gappedFrame: '' }

    expect(checkFrames(homeWithLaterFrame(ungapped))).toEqual([
      'lesson-1-1, later frame for lesson-3: gapped frame is not its frame with home replaced by ____',
    ])
  })

  it('fails a later frame written for a unit lesson', () => {
    const unit = workOn('We work on the food.', 'We ____ ____ the food.')
    const content = homeWithLaterFrame(laterFrameOf('home', 'We have my home.', 'lesson-2'), unit)

    expect(checkFrames(content)).toEqual(['lesson-1-1: later frame names lesson-2, a unit lesson'])
  })

  it("fails a later frame written for the word's own lesson", () => {
    const content = homeWithLaterFrame(laterFrameOf('home', 'We have my home.', 'lesson-1'))

    expect(checkFrames(content)).toEqual([
      'lesson-1-1: later frame names lesson-1, which is not after its own lesson-1',
    ])
  })

  it("fails a later frame written for a lesson before the word's own", () => {
    const leaveWithEarlyFrame = entryOf('word-1', 'leave', 'We leave home.', {
      partOfSpeech: 'verb',
      laterFrames: [laterFrameOf('leave', 'They leave school.', 'lesson-1')],
    })
    const content = afterLessonOne(leaveWithEarlyFrame)

    expect(checkFrames(content)).toEqual([
      'word-1: later frame names lesson-1, which is not after its own lesson-2',
    ])
  })

  it('fails a later frame written for a lesson the curriculum does not list', () => {
    const content = homeWithLaterFrame(laterFrameOf('home', 'We have my home.', 'lesson-9'))

    expect(checkFrames(content)).toEqual([
      'lesson-1-1: later frame names lesson-9, a lesson the curriculum does not list',
    ])
  })
})
