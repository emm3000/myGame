import type { LineLanguage } from '../design-system/Label'

const storageKey = 'myGame.signedOutLanguage'

const throughStorage = <T>(
  storageOf: () => Storage,
  use: (storage: Storage) => T,
): T | undefined => {
  try {
    return use(storageOf())
  } catch {
    return undefined
  }
}

const isLineLanguage = (value: string | null): value is LineLanguage =>
  value === 'en' || value === 'es'

const storedLanguageOf = (storage: Storage): LineLanguage | undefined => {
  const stored = storage.getItem(storageKey)
  return isLineLanguage(stored) ? stored : undefined
}

export const signedOutLanguageOf = (
  storageOf: () => Storage,
  browserLanguage: string,
): LineLanguage =>
  throughStorage(storageOf, storedLanguageOf) ?? (/^es(-|$)/i.test(browserLanguage) ? 'es' : 'en')

export const keepSignedOutLanguage = (storageOf: () => Storage, language: LineLanguage): void => {
  throughStorage(storageOf, (storage) => storage.setItem(storageKey, language))
}
