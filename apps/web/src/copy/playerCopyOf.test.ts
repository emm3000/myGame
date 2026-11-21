import { es } from '@mygame/catalog'
import { expect, it } from 'vitest'
import { playerCopyOf } from './playerCopyOf'

const report = (copy: ReturnType<typeof playerCopyOf>): ReturnType<typeof copy.chrome> =>
  copy.chrome((catalog) => catalog.shellNavigationReport())

it('draws the chrome in Spanish alone in the scaffold phase', () => {
  expect(report(playerCopyOf({ scaffold: 'es', chromePhase: 'scaffold' }))).toEqual({
    text: 'Informe',
    language: 'es',
    translation: null,
  })
})

it('draws the chrome in English over Spanish in the both phase', () => {
  expect(report(playerCopyOf({ scaffold: 'es', chromePhase: 'both' }))).toEqual({
    text: 'Report',
    language: 'en',
    translation: { text: 'Informe', language: 'es' },
  })
})

it('draws the chrome in English alone in the English phase', () => {
  expect(report(playerCopyOf({ scaffold: 'es', chromePhase: 'english' }))).toEqual({
    text: 'Report',
    language: 'en',
    translation: null,
  })
})

it('draws the chrome in English alone under none', () => {
  expect(report(playerCopyOf({ scaffold: 'none', chromePhase: 'english' }))).toEqual({
    text: 'Report',
    language: 'en',
    translation: null,
  })
})

it('draws no translation in the both phase when both languages write the same line', () => {
  const title = playerCopyOf({ scaffold: 'es', chromePhase: 'both' }).chrome((catalog) =>
    catalog.shellTitle(),
  )

  expect(title).toEqual({ text: 'Townword', language: 'en', translation: null })
})

it('passes the arguments to both languages in the both phase', () => {
  const words = playerCopyOf({ scaffold: 'es', chromePhase: 'both' }).chrome((catalog) =>
    catalog.shellRetainedWords({ count: 2, total: 5 }),
  )

  expect(words).toEqual({
    text: '2 of 5 words learned',
    language: 'en',
    translation: { text: '2 de 5 palabras aprendidas', language: 'es' },
  })
})

it('keeps the fixed copy in Spanish for an es player in the English phase', () => {
  const signOut = playerCopyOf({ scaffold: 'es', chromePhase: 'english' }).fixedCopy((catalog) =>
    catalog.shellSignOut(),
  )

  expect(signOut).toEqual({ text: 'Salir', language: 'es', translation: null })
})

it('writes the fixed copy in English under none', () => {
  const signOut = playerCopyOf({ scaffold: 'none', chromePhase: 'english' }).fixedCopy((catalog) =>
    catalog.shellSignOut(),
  )

  expect(signOut).toEqual({ text: 'Sign out', language: 'en', translation: null })
})

it('refuses a fixed-copy line as chrome', () => {
  const copy = playerCopyOf({ scaffold: 'es', chromePhase: 'both' })

  // @ts-expect-error shell.signOut is fixed copy, which never follows the chrome phase
  expect(copy.chrome((catalog) => catalog.shellSignOut()).text).toBe('Sign out')
})

it('refuses a chrome line as fixed copy', () => {
  const copy = playerCopyOf({ scaffold: 'es', chromePhase: 'both' })

  // @ts-expect-error shell.navigation.report is chrome, which follows the chrome phase
  expect(copy.fixedCopy((catalog) => catalog.shellNavigationReport()).text).toBe('Informe')
})

it('hands a fixed-copy line the chrome of the scaffold for its pieces in the English phase', () => {
  const rates = playerCopyOf({ scaffold: 'es', chromePhase: 'english' }).fixedCopy(
    (catalog, scaffoldChrome) =>
      catalog.reviewSkillRates({
        resource: scaffoldChrome.namesTownResourcesFood(),
        before: 120,
        after: 126,
      }),
  )

  expect(rates.text).toBe(
    es.reviewSkillRates({ resource: es.namesTownResourcesFood(), before: 120, after: 126 }),
  )
})
