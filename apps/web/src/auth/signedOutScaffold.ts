import { type Scaffold, ScaffoldSchema } from '@mygame/contracts'

const storageKey = 'myGame.signedOutScaffold'

const storedScaffoldOf = (storage: Storage): Scaffold | undefined => {
  const parsed = ScaffoldSchema.safeParse(storage.getItem(storageKey))
  return parsed.success ? parsed.data : undefined
}

export const signedOutScaffoldOf = (storage: Storage, browserLanguage: string): Scaffold =>
  storedScaffoldOf(storage) ?? (/^es(-|$)/i.test(browserLanguage) ? 'es' : 'none')

export const keepSignedOutScaffold = (storage: Storage, scaffold: Scaffold): void => {
  storage.setItem(storageKey, scaffold)
}
