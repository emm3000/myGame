import type { Label, LineLanguage } from './Label'

export function lineLabelOf(text: string, language: LineLanguage): Label {
  return { text, language, translation: null }
}
