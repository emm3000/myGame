import { describe, expect, it } from 'vitest'
import { ApiErrorSchema } from './index'

describe('ApiErrorSchema', () => {
  it('parses a kind without fields as the kind alone', () => {
    const insufficientResources = { kind: 'InsufficientResources' }

    expect(ApiErrorSchema.parse(insufficientResources)).toEqual(insufficientResources)
  })

  it('parses the refusal of a blank fief name', () => {
    const blankFiefName = { kind: 'BlankFiefName' }

    expect(ApiErrorSchema.parse(blankFiefName)).toEqual(blankFiefName)
  })

  it('rejects a message on the wire', () => {
    const queueFull = { kind: 'QueueFull', message: 'Ya no caben más obras en espera.' }

    expect(ApiErrorSchema.safeParse(queueFull).success).toBe(false)
  })

  it('rejects params on a kind without fields', () => {
    const queueFull = { kind: 'QueueFull', params: { cap: 3 } }

    expect(ApiErrorSchema.safeParse(queueFull).success).toBe(false)
  })

  it('parses a stay out of range with its longest stay', () => {
    const stayOutOfRange = { kind: 'StayOutOfRange', params: { maxStayHours: 8 } }

    expect(ApiErrorSchema.parse(stayOutOfRange)).toEqual(stayOutOfRange)
  })

  it('parses a party short at home with its unit and both counts', () => {
    const unitsShort = {
      kind: 'NotEnoughUnitsAtHome',
      params: { unit: 'cavalry', count: 7, atHome: 6 },
    }

    expect(ApiErrorSchema.parse(unitsShort)).toEqual(unitsShort)
  })

  it('parses a barracks too low with the unit and the level it requires', () => {
    const barracksTooLow = {
      kind: 'BarracksTooLow',
      params: { unit: 'settler', requiredBarracksLevel: 5 },
    }

    expect(ApiErrorSchema.parse(barracksTooLow)).toEqual(barracksTooLow)
  })

  it('parses a fief cap with the cap', () => {
    const fiefCapReached = { kind: 'FiefCapReached', params: { cap: 2 } }

    expect(ApiErrorSchema.parse(fiefCapReached)).toEqual(fiefCapReached)
  })

  it('parses a cargo above the carry with both amounts', () => {
    const cargoAboveCarry = { kind: 'CargoAboveCarry', params: { cargo: 721, carry: 720 } }

    expect(ApiErrorSchema.parse(cargoAboveCarry)).toEqual(cargoAboveCarry)
  })

  it('rejects a slotted kind without its params', () => {
    expect(ApiErrorSchema.safeParse({ kind: 'StayOutOfRange' }).success).toBe(false)
  })

  it('rejects a fractional longest stay', () => {
    const stayOutOfRange = { kind: 'StayOutOfRange', params: { maxStayHours: 7.5 } }

    expect(ApiErrorSchema.safeParse(stayOutOfRange).success).toBe(false)
  })

  it('rejects a party short at home naming an unknown unit', () => {
    const unitsShort = {
      kind: 'NotEnoughUnitsAtHome',
      params: { unit: 'pikeman', count: 7, atHome: 6 },
    }

    expect(ApiErrorSchema.safeParse(unitsShort).success).toBe(false)
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
