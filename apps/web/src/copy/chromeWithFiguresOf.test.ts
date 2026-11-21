import { en, es } from '@mygame/catalog'
import { expect, it } from 'vitest'
import { chromeWithFiguresOf } from './chromeWithFiguresOf'
import { playerCopyOf } from './playerCopyOf'

const needOf = (copy: ReturnType<typeof playerCopyOf>): ReturnType<typeof chromeWithFiguresOf> =>
  chromeWithFiguresOf(copy, (catalog, figure) =>
    catalog.townWordsNeeded({ standing: 'stable', needed: figure('10'), held: figure('7') }),
  )

it('records each figure at its place in the line it draws', () => {
  const label = needOf(playerCopyOf({ scaffold: 'es', chromePhase: 'scaffold' }))
  const text = es.townWordsNeeded({ standing: 'stable', needed: 10, held: 7 })

  expect([label.text, label.figures]).toEqual([
    text,
    [
      { at: text.indexOf('10'), text: '10' },
      { at: text.indexOf('7'), text: '7' },
      { at: text.lastIndexOf('10'), text: '10' },
    ],
  ])
})

it('records the figures of the translation in the both phase', () => {
  const label = needOf(playerCopyOf({ scaffold: 'es', chromePhase: 'both' }))
  const translation = es.townWordsNeeded({ standing: 'stable', needed: 10, held: 7 })

  expect(label.translation).toEqual({
    text: translation,
    language: 'es',
    figures: [
      { at: translation.indexOf('10'), text: '10' },
      { at: translation.indexOf('7'), text: '7' },
      { at: translation.lastIndexOf('10'), text: '10' },
    ],
  })
})

it('leaves out the figures of a line that holds none', () => {
  const label = chromeWithFiguresOf(
    playerCopyOf({ scaffold: 'none', chromePhase: 'english' }),
    (catalog) => catalog.townNotBuilt(),
  )

  expect(label).toEqual({ text: en.townNotBuilt(), language: 'en', translation: null })
})
