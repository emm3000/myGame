import type { en, es } from '@mygame/catalog'
import type { Label } from '../design-system/Label'

export type Catalog = typeof en | typeof es

export type CatalogLine = (catalog: Catalog) => string

export interface PlayerCopy {
  readonly chrome: (line: CatalogLine) => Label
  readonly fixedCopy: (line: CatalogLine) => string
}
