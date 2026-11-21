import { expect, it } from 'vitest'
import { chromeAroundOf } from './chromeAroundOf'
import { playerCopyOf } from './playerCopyOf'

it('keeps a title holding replacement patterns as written', () => {
  const copy = playerCopyOf({ scaffold: 'es', chromePhase: 'scaffold' })
  const title = 'Cost $$ and $& more'

  const label = chromeAroundOf(copy, (catalog, inset) => catalog.townNextText({ title: inset }), {
    text: title,
    language: 'en',
  })

  expect(label.text).toBe(`Lee: ${title}`)
  expect(label.inset).toEqual({ at: 5, text: title, language: 'en' })
})
