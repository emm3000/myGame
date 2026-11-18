import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { assert, describe, expect, it } from 'vitest'
import en from '../en.json'
import { typeScriptOf } from './typeScriptOf'

const tooFewStableWords = { needed: 10, held: 9, standing: 'stable' }

const englishStableLine =
  'This level needs 10 words out of learning and you have 9. Study new lessons and review the words that are due.'

const renderedEnglish = async (key: keyof typeof en): Promise<string> => {
  const path = join(mkdtempSync(join(tmpdir(), 'catalog-refusal-')), 'messages.ts')
  writeFileSync(path, typeScriptOf({ 'refusal.rendered': en[key] }))
  const module: Record<string, unknown> = await import(path)
  const message = module.refusalRendered
  assert(typeof message === 'function')
  return String(message(tooFewStableWords))
}

describe('the English refusal for too few stable words', () => {
  it('reads them as words out of learning on the web and the api', async () => {
    expect(await renderedEnglish('refusal.NotEnoughWords')).toBe(englishStableLine)
  })

  it('reads them as words out of learning on Android', async () => {
    expect(await renderedEnglish('android.town.town_refusal_not_enough_words')).toBe(
      englishStableLine,
    )
  })
})
