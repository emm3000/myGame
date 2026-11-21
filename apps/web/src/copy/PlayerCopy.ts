import type { en, es, FixedCopyName } from '@mygame/catalog'
import type { Label } from '../design-system/Label'

export type Catalog = typeof en | typeof es

type FixedCopyFunctionName = FixedCopyName & keyof Catalog

export type ChromeCatalog = Omit<Catalog, FixedCopyFunctionName>

export type FixedCopyCatalog = Pick<Catalog, FixedCopyFunctionName>

export interface PlayerCopy {
  readonly chrome: (line: (catalog: ChromeCatalog) => string) => Label
  readonly fixedCopy: (
    line: (catalog: FixedCopyCatalog, scaffoldChrome: ChromeCatalog) => string,
  ) => Label
}
