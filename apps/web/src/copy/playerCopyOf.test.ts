import { expect, it } from 'vitest'
import { playerCopyOf } from './playerCopyOf'

const report = (copy: ReturnType<typeof playerCopyOf>): ReturnType<typeof copy.chrome> =>
  copy.chrome((catalog) => catalog.shellNavigationReport())

it('draws the chrome in Spanish alone in the scaffold phase', () => {
  expect(report(playerCopyOf({ scaffold: 'es', chromePhase: 'scaffold' }))).toEqual({
    text: 'Informe',
    translation: null,
  })
})

it('draws the chrome in English over Spanish in the both phase', () => {
  expect(report(playerCopyOf({ scaffold: 'es', chromePhase: 'both' }))).toEqual({
    text: 'Report',
    translation: 'Informe',
  })
})

it('draws the chrome in English alone in the English phase', () => {
  expect(report(playerCopyOf({ scaffold: 'es', chromePhase: 'english' }))).toEqual({
    text: 'Report',
    translation: null,
  })
})

it('draws the chrome in English alone under none', () => {
  expect(report(playerCopyOf({ scaffold: 'none', chromePhase: 'english' }))).toEqual({
    text: 'Report',
    translation: null,
  })
})

it('draws no translation in the both phase when both languages write the same line', () => {
  const title = playerCopyOf({ scaffold: 'es', chromePhase: 'both' }).chrome((catalog) =>
    catalog.shellTitle(),
  )

  expect(title).toEqual({ text: 'Townword', translation: null })
})

it('passes the arguments to both languages in the both phase', () => {
  const words = playerCopyOf({ scaffold: 'es', chromePhase: 'both' }).chrome((catalog) =>
    catalog.shellRetainedWords({ count: 2, total: 5 }),
  )

  expect(words).toEqual({ text: '2 of 5 words learned', translation: '2 de 5 palabras aprendidas' })
})

it('keeps the fixed copy in Spanish for an es player in the English phase', () => {
  const signOut = playerCopyOf({ scaffold: 'es', chromePhase: 'english' }).fixedCopy((catalog) =>
    catalog.shellSignOut(),
  )

  expect(signOut).toBe('Salir')
})

it('writes the fixed copy in English under none', () => {
  const signOut = playerCopyOf({ scaffold: 'none', chromePhase: 'english' }).fixedCopy((catalog) =>
    catalog.shellSignOut(),
  )

  expect(signOut).toBe('Sign out')
})
