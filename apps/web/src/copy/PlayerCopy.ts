import type { en, es, FixedCopyName } from '@mygame/catalog'
import type { Label } from '../design-system/Label'

export type Catalog = typeof en | typeof es

type FixedCopyFunctionName = FixedCopyName & keyof Catalog

export type ChromeCatalog = Omit<Catalog, FixedCopyFunctionName>

export type FixedCopyCatalog = Pick<Catalog, FixedCopyFunctionName>

export type FixedLinePieces = Pick<
  ChromeCatalog,
  | 'locale'
  | 'statusTomorrow'
  | 'namesTownResourcesMoney'
  | 'namesTownResourcesFood'
  | 'namesTownResourcesPower'
  | 'namesTownResourcesMaterial'
>

export interface PlayerCopy {
  readonly chrome: (line: (catalog: ChromeCatalog) => string) => Label
  readonly fixedCopy: (
    line: (catalog: FixedCopyCatalog, pieces: FixedLinePieces) => string,
  ) => Label
}
