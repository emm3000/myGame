import { Instant } from '../time/Instant'
import type { BuildingKind } from '../town/BuildingKind'
import type { BuildingLevel } from '../town/BuildingLevel'
import type { TownCatalog } from '../town/TownCatalog'
import type { ProductionPercent, TownSettings } from '../town/TownSettings'

const unscaled: ProductionPercent = { money: 100, food: 100, power: 100, material: 100 }

const noCost = { money: 0, food: 0, power: 0, material: 0 }

export const plainTownSettings: TownSettings = {
  startingStocks: { money: 400, food: 300, power: 200, material: 500 },
  taxRatePerHour: 12,
  basePeople: 10,
  cityPeople: 50,
  storageBaseCapacity: 1000,
  sitesPerArea: 15,
  terrainBonusPerHour: 5,
  waitingListCap: 2,
  seasons: {
    epoch: Instant.fromEpochMilliseconds(1_791_158_400_000),
    daysPerSeason: 7,
    productionPercent: { spring: unscaled, summer: unscaled, fall: unscaled, winter: unscaled },
    durationPercent: {
      spring: { build: 100 },
      summer: { build: 100 },
      fall: { build: 100 },
      winter: { build: 100 },
    },
  },
}

const levelTerms = (level: number): Pick<BuildingLevel, 'level' | 'cost' | 'durationSeconds'> => ({
  level,
  cost: noCost,
  durationSeconds: 60 * level,
})

export const plainTownLevels: ReadonlyArray<BuildingLevel> = [1, 2].flatMap((level) => [
  { ...levelTerms(level), building: 'homes', people: 0, peopleSupplied: 20 * level },
  { ...levelTerms(level), building: 'farm', people: 2 * level, ratePerHour: 30 * level },
  { ...levelTerms(level), building: 'factory', people: 3 * level, ratePerHour: 20 * level },
  { ...levelTerms(level), building: 'powerStation', people: 2 * level, ratePerHour: 25 * level },
  { ...levelTerms(level), building: 'storage', people: level, capacityUnits: 1500 * level },
  {
    ...levelTerms(level),
    building: 'school',
    people: 4 * level,
    lessonPercent: 100 - 10 * (level - 1),
    learningCap: 15 + 5 * (level - 1),
  },
  { ...levelTerms(level), building: 'office', people: 5 * level, hires: ['worker'] },
])

const keyOf = (building: BuildingKind, level: number): string => `${building}:${level}`

export const townCatalogOf = (
  settings: TownSettings = plainTownSettings,
  levels: ReadonlyArray<BuildingLevel> = plainTownLevels,
): TownCatalog => {
  const byKey = new Map(levels.map((line) => [keyOf(line.building, line.level), line]))
  return {
    levelOf: (building, level) => byKey.get(keyOf(building, level)),
    townSettings: () => settings,
  }
}
