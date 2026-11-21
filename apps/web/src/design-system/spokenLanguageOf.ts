import type { Label, LineLanguage } from './Label'

export function spokenLanguageOf({ language, translation }: Label): LineLanguage | undefined {
  return translation === null ? language : undefined
}
