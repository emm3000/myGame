import { expect, it } from 'vitest'
import es from '../es.json'

it('writes every Android plural count as an ungrouped number, never as #, which ICU groups', () => {
  const poundedAndroidKeys = Object.entries(es)
    .filter(([key]) => key.startsWith('android.'))
    .filter(([, pattern]) => pattern.replaceAll(/'[^']*'/g, '').includes('#'))
    .map(([key]) => key)

  expect(poundedAndroidKeys).toEqual([])
})
