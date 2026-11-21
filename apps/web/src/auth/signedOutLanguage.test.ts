import { afterEach, expect, it } from 'vitest'
import { keepSignedOutLanguage, signedOutLanguageOf } from './signedOutLanguage'

const browserStorage = (): Storage => localStorage

const blockedStorage = (): Storage => {
  throw new DOMException('The operation is insecure.', 'SecurityError')
}

afterEach(() => localStorage.clear())

it('draws Spanish for a Spanish browser', () => {
  expect(signedOutLanguageOf(browserStorage, 'es-AR')).toBe('es')
  expect(signedOutLanguageOf(browserStorage, 'es')).toBe('es')
})

it('draws English for any other browser', () => {
  expect(signedOutLanguageOf(browserStorage, 'en-US')).toBe('en')
  expect(signedOutLanguageOf(browserStorage, 'pt-BR')).toBe('en')
  expect(signedOutLanguageOf(browserStorage, 'est')).toBe('en')
})

it('keeps the language the visitor switched to over the browser', () => {
  keepSignedOutLanguage(browserStorage, 'en')

  expect(signedOutLanguageOf(browserStorage, 'es-ES')).toBe('en')
})

it('falls back to the browser when the storage is blocked', () => {
  keepSignedOutLanguage(blockedStorage, 'en')

  expect(signedOutLanguageOf(blockedStorage, 'es-ES')).toBe('es')
})

it('ignores a stored value that names no language', () => {
  localStorage.setItem('myGame.signedOutLanguage', 'fr')

  expect(signedOutLanguageOf(browserStorage, 'es-MX')).toBe('es')
})
