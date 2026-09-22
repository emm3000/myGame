import {
  copyFileSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { composeServer } from './composeServer'

const contentDirectory = fileURLToPath(new URL('../content/', import.meta.url))

const oneLevel = (effect: object): object => ({
  level: 1,
  cost: { wood: 10, stone: 5, iron: 0, gold: 0, food: 0 },
  durationSeconds: 60,
  peasantOccupancy: 1,
  effect,
})

const minimalContentFiles: Readonly<Record<string, object>> = {
  'sawmill.json': { building: 'sawmill', levels: [oneLevel({ ratePerHour: 30 })] },
  'quarry.json': { building: 'quarry', levels: [oneLevel({ ratePerHour: 20 })] },
  'iron-mine.json': { building: 'ironMine', levels: [oneLevel({ ratePerHour: 10 })] },
  'farm.json': { building: 'farm', levels: [oneLevel({ ratePerHour: 25, peasantSupply: 5 })] },
  'warehouse.json': { building: 'warehouse', levels: [oneLevel({ capacity: 1500 })] },
  'fief.json': {
    startingStocks: { wood: 500, stone: 500, iron: 200, gold: 50, food: 300 },
    startingCapacity: 1000,
    basePeasantSupply: 10,
    terrainBonus: {
      lowlands: { resource: 'food', ratePerHour: 5 },
      uplands: { resource: 'stone', ratePerHour: 4 },
      ridges: { resource: 'iron', ratePerHour: 2 },
    },
  },
}

const temporaryDirectory = (): string => mkdtempSync(join(tmpdir(), 'mygame-content-'))

const minimalContentDirectory = (): string => {
  const directory = temporaryDirectory()
  for (const [file, content] of Object.entries(minimalContentFiles)) {
    writeFileSync(join(directory, file), JSON.stringify(content))
  }
  return directory
}

const contentCopyWithTruncatedSawmill = (): string => {
  const directory = temporaryDirectory()
  for (const file of readdirSync(contentDirectory)) {
    copyFileSync(join(contentDirectory, file), join(directory, file))
  }
  const sawmill = readFileSync(join(directory, 'sawmill.json'), 'utf8')
  writeFileSync(join(directory, 'sawmill.json'), sawmill.slice(0, sawmill.length / 2))
  return directory
}

const removeDirectory = (directory: string): void => {
  rmSync(directory, { recursive: true, force: true })
}

describe('composeServer', () => {
  let fixtureDirectory = ''

  beforeAll(() => {
    fixtureDirectory = minimalContentDirectory()
  })

  afterAll(() => {
    removeDirectory(fixtureDirectory)
  })

  it('listens on the port API_PORT names', () => {
    const server = composeServer({ API_PORT: '3106' }, fixtureDirectory)

    expect(server.port).toBe(3106)
  })

  it('builds a catalog from the content folder at start-up', () => {
    const server = composeServer({ API_PORT: '3106' }, contentDirectory)

    expect(server.buildingCatalog.levelOf('sawmill', 1)).toEqual({
      building: 'sawmill',
      level: 1,
      cost: { wood: 60, stone: 15, iron: 0, gold: 0, food: 0 },
      durationSeconds: 120,
      peasantOccupancy: 1,
      ratePerHour: 30,
    })
  })

  it('reads the new fief settings from the content folder at start-up', () => {
    const server = composeServer({ API_PORT: '3106' }, contentDirectory)

    expect(server.buildingCatalog.fiefSettings().startingStocks).toEqual({
      wood: 500,
      stone: 500,
      iron: 200,
      gold: 50,
      food: 300,
    })
  })

  it('fails start-up on a malformed content file', () => {
    const malformedDirectory = contentCopyWithTruncatedSawmill()

    try {
      expect(() => composeServer({ API_PORT: '3106' }, malformedDirectory)).toThrow('sawmill.json')
    } finally {
      removeDirectory(malformedDirectory)
    }
  })

  it('refuses to compose without API_PORT', () => {
    expect(() => composeServer({}, fixtureDirectory)).toThrow('API_PORT')
  })

  it('refuses to compose with a non-integer API_PORT', () => {
    expect(() => composeServer({ API_PORT: '31.5' }, fixtureDirectory)).toThrow('API_PORT')
  })

  it('refuses to compose with a non-positive API_PORT', () => {
    expect(() => composeServer({ API_PORT: '0' }, fixtureDirectory)).toThrow('API_PORT')
  })

  it('refuses to compose with an API_PORT above 65535', () => {
    expect(() => composeServer({ API_PORT: '65536' }, fixtureDirectory)).toThrow('API_PORT')
  })
})
