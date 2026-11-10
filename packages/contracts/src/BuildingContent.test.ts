import { describe, expect, it } from 'vitest'
import { BuildingContentSchema } from './index'

const levelOne = {
  level: 1,
  cost: { money: 40, food: 0, power: 0, material: 60 },
  durationSeconds: 90,
  people: 2,
}

const workerTerms = {
  cost: { money: 40, food: 0, power: 0, material: 0 },
  durationSeconds: 120,
  people: 1,
  strength: 1,
  carry: 50,
  roadPercent: 100,
}

const officeHires = { worker: workerTerms, truck: { ...workerTerms, carry: 200, roadPercent: 50 } }

describe('BuildingContentSchema', () => {
  it('parses a homes level with the people it supplies', () => {
    const homes = { building: 'homes', levels: [{ ...levelOne, effect: { peopleSupplied: 20 } }] }

    expect(BuildingContentSchema.parse(homes)).toEqual(homes)
  })

  it('parses a power station level with its power rate', () => {
    const powerStation = {
      building: 'powerStation',
      levels: [{ ...levelOne, effect: { ratePerHour: 25 } }],
    }

    expect(BuildingContentSchema.parse(powerStation)).toEqual(powerStation)
  })

  it('parses a school level with its lesson percent and learning cap', () => {
    const school = {
      building: 'school',
      levels: [{ ...levelOne, effect: { lessonPercent: 100, learningCap: 15 } }],
    }

    expect(BuildingContentSchema.parse(school)).toEqual(school)
  })

  it('refuses an office level that hires nobody', () => {
    const office = {
      building: 'office',
      hires: officeHires,
      levels: [{ ...levelOne, effect: { hires: [] } }],
    }

    expect(BuildingContentSchema.safeParse(office).success).toBe(false)
  })

  it('parses the office with the terms of each hire kind', () => {
    const office = {
      building: 'office',
      hires: officeHires,
      levels: [{ ...levelOne, effect: { hires: ['worker'] } }],
    }

    expect(BuildingContentSchema.parse(office)).toEqual(office)
  })

  it('refuses an office missing the terms of a hire kind', () => {
    const office = {
      building: 'office',
      hires: { worker: workerTerms },
      levels: [{ ...levelOne, effect: { hires: ['worker'] } }],
    }

    expect(BuildingContentSchema.safeParse(office).success).toBe(false)
  })

  it('refuses a hire that takes no time', () => {
    const office = {
      building: 'office',
      hires: { ...officeHires, worker: { ...workerTerms, durationSeconds: 0 } },
      levels: [{ ...levelOne, effect: { hires: ['worker'] } }],
    }

    expect(BuildingContentSchema.safeParse(office).success).toBe(false)
  })

  it('refuses a cost in a medieval resource', () => {
    const farm = {
      building: 'farm',
      levels: [{ ...levelOne, cost: { ...levelOne.cost, wood: 10 }, effect: { ratePerHour: 30 } }],
    }

    expect(BuildingContentSchema.safeParse(farm).success).toBe(false)
  })

  it('refuses a building the town does not have', () => {
    const sawmill = { building: 'sawmill', levels: [{ ...levelOne, effect: { ratePerHour: 30 } }] }

    expect(BuildingContentSchema.safeParse(sawmill).success).toBe(false)
  })
})
