import { type Scaffold, ScaffoldSchema } from '@mygame/contracts'

const storageKey = 'myGame.signedOutScaffold'

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

const storedScaffoldOf = (storage: Storage): Scaffold | undefined => {
  const parsed = ScaffoldSchema.safeParse(storage.getItem(storageKey))
  return parsed.success ? parsed.data : undefined
}

export const signedOutScaffoldOf = (storageOf: () => Storage, browserLanguage: string): Scaffold =>
  throughStorage(storageOf, storedScaffoldOf) ?? (/^es(-|$)/i.test(browserLanguage) ? 'es' : 'none')

export const keepSignedOutScaffold = (storageOf: () => Storage, scaffold: Scaffold): void => {
  throughStorage(storageOf, (storage) => storage.setItem(storageKey, scaffold))
}
