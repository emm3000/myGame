import { describe, expect, it } from 'vitest'
import { ApiErrorSchema } from './index'

describe('ApiErrorSchema', () => {
  it('parses a kind without fields as the kind alone', () => {
    const studySlotBusy = { kind: 'StudySlotBusy' }

    expect(ApiErrorSchema.parse(studySlotBusy)).toEqual(studySlotBusy)
  })

  it('parses a school too low as its kind alone', () => {
    const schoolTooLow = { kind: 'LessonSchoolTooLow' }

    expect(ApiErrorSchema.parse(schoolTooLow)).toEqual(schoolTooLow)
  })

  it('parses a full learning cap with the cap and the cards in learning', () => {
    const capReached = {
      kind: 'LearningCapReached',
      params: { learningCap: 15, cardsInLearning: 12 },
    }

    expect(ApiErrorSchema.parse(capReached)).toEqual(capReached)
  })

  it('rejects a full learning cap without its params', () => {
    expect(ApiErrorSchema.safeParse({ kind: 'LearningCapReached' }).success).toBe(false)
  })

  it('rejects the library gate of a lesson', () => {
    expect(ApiErrorSchema.safeParse({ kind: 'LessonLibraryTooLow' }).success).toBe(false)
  })

  it('rejects a message on the wire', () => {
    const busy = { kind: 'StudySlotBusy', message: 'Ya estás estudiando una lección.' }

    expect(ApiErrorSchema.safeParse(busy).success).toBe(false)
  })

  it('rejects params on a kind without fields', () => {
    const busy = { kind: 'StudySlotBusy', params: { cap: 3 } }

    expect(ApiErrorSchema.safeParse(busy).success).toBe(false)
  })

  it('rejects a slotted kind without its params', () => {
    expect(ApiErrorSchema.safeParse({ kind: 'WaitingListFull' }).success).toBe(false)
  })

  it('rejects a fractional waiting list cap', () => {
    const waitingListFull = { kind: 'WaitingListFull', params: { cap: 2.5 } }

    expect(ApiErrorSchema.safeParse(waitingListFull).success).toBe(false)
  })

  it('rejects a medieval kind', () => {
    expect(ApiErrorSchema.safeParse({ kind: 'QueueFull', params: { cap: 2 } }).success).toBe(false)
  })

  it('rejects an unknown kind', () => {
    expect(ApiErrorSchema.safeParse({ kind: 'QueueBusy' }).success).toBe(false)
  })

  it('parses a full waiting list with its cap', () => {
    const waitingListFull = { kind: 'WaitingListFull', params: { cap: 3 } }

    expect(ApiErrorSchema.parse(waitingListFull)).toEqual(waitingListFull)
  })

  it('parses too few free people with the people the work needs and the free ones', () => {
    const notEnoughPeople = {
      kind: 'NotEnoughPeople',
      params: { requiredPeople: 4, freePeople: 1 },
    }

    expect(ApiErrorSchema.parse(notEnoughPeople)).toEqual(notEnoughPeople)
  })

  it('parses a shortfall with the town resources it misses', () => {
    const notEnoughResources = {
      kind: 'NotEnoughResources',
      params: { missing: { money: 20, food: 0, power: 0, material: 5 } },
    }

    expect(ApiErrorSchema.parse(notEnoughResources)).toEqual(notEnoughResources)
  })

  it('rejects a shortfall in a medieval resource', () => {
    const notEnoughResources = {
      kind: 'NotEnoughResources',
      params: { missing: { wood: 20, stone: 0, iron: 0, gold: 0, food: 0 } },
    }

    expect(ApiErrorSchema.safeParse(notEnoughResources).success).toBe(false)
  })

  it('parses a top level with the town building and its level', () => {
    const topLevelReached = { kind: 'TopLevelReached', params: { building: 'farm', level: 10 } }

    expect(ApiErrorSchema.parse(topLevelReached)).toEqual(topLevelReached)
  })

  it('parses work not found with the building and level it names', () => {
    const workNotFound = {
      kind: 'BuildingWorkNotFound',
      params: { building: 'powerStation', level: 2 },
    }

    expect(ApiErrorSchema.parse(workNotFound)).toEqual(workNotFound)
  })

  it('rejects work not found naming a medieval building', () => {
    const workNotFound = { kind: 'BuildingWorkNotFound', params: { building: 'sawmill', level: 2 } }

    expect(ApiErrorSchema.safeParse(workNotFound).success).toBe(false)
  })

  it('parses the town refusals without fields as the kind alone', () => {
    const bare = ['TownNotFound', 'PlayerAlreadyHoldsTown', 'BlankTownName'].map((kind) => ({
      kind,
    }))

    expect(bare.map((error) => ApiErrorSchema.parse(error))).toEqual(bare)
  })
})
