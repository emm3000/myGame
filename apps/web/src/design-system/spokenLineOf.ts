import type { Label } from './Label'

export function spokenLineOf({ text, translation }: Label): string {
  return translation === null ? text : `${text} ${translation}`
}
