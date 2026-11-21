import type { Catalog } from '../copy/PlayerCopy'
import type { LineLanguage } from '../design-system/Label'

export interface SignedOutCopy {
  readonly language: LineLanguage
  readonly catalog: Catalog
  readonly onSwitch: (language: LineLanguage) => void
}
