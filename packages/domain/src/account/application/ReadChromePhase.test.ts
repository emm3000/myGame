import { describe, expect, it } from 'vitest'
import { Instant } from '#time/Instant'
import { MemoryChromeProgressReader } from '../testing/MemoryChromeProgressReader'
import { ReadChromePhase } from './ReadChromePhase'

const dawn = Instant.fromEpochMilliseconds(Date.parse('2026-09-28T08:00:00Z'))

describe('ReadChromePhase', () => {
  it('refuses a player who holds no account as signed out', async () => {
    const readChromePhase = new ReadChromePhase({
      chromeProgress: new MemoryChromeProgressReader(),
      lessons: { lessonOf: () => undefined, chromeLessons: () => [] },
      clock: { now: () => dawn },
    })

    const phase = await readChromePhase.execute({
      id: '00000000-0000-4000-8000-000000000001',
      email: 'ana@example.com',
      emailVerified: true,
      scaffold: 'es',
      scaffoldVersion: 1,
    })

    expect(phase).toEqual({ ok: false, error: { kind: 'SignedOut' } })
  })
})
