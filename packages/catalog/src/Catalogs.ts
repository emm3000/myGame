import type { Messages } from './Messages'

export type Language = 'en' | 'es'

export type Catalogs = {
  readonly en: Messages
  readonly es: Messages
}
