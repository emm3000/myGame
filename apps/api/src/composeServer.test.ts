import { copyFileSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { composeServer } from './composeServer'

const contentDirectory = fileURLToPath(new URL('../content/', import.meta.url))

const contentCopyWithTruncatedSawmill = (): string => {
  const directory = mkdtempSync(join(tmpdir(), 'mygame-content-'))
  for (const file of readdirSync(contentDirectory)) {
    copyFileSync(join(contentDirectory, file), join(directory, file))
  }
  const sawmill = readFileSync(join(directory, 'sawmill.json'), 'utf8')
  writeFileSync(join(directory, 'sawmill.json'), sawmill.slice(0, sawmill.length / 2))
  return directory
}

describe('composeServer', () => {
  it('listens on the port API_PORT names', () => {
    const server = composeServer({ API_PORT: '3106' }, contentDirectory)

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

    expect(() => composeServer({ API_PORT: '3106' }, malformedDirectory)).toThrow('sawmill.json')
  })

  it('refuses to compose without API_PORT', () => {
    expect(() => composeServer({}, contentDirectory)).toThrow('API_PORT')
  })

  it('refuses to compose with a non-integer API_PORT', () => {
    expect(() => composeServer({ API_PORT: '31.5' }, contentDirectory)).toThrow('API_PORT')
  })

  it('refuses to compose with a non-positive API_PORT', () => {
    expect(() => composeServer({ API_PORT: '0' }, contentDirectory)).toThrow('API_PORT')
  })

  it('refuses to compose with an API_PORT above 65535', () => {
    expect(() => composeServer({ API_PORT: '65536' }, contentDirectory)).toThrow('API_PORT')
  })
})
