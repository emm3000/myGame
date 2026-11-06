import type { DesignSystemFile } from './DesignSystemFile'
import { kotlinColorsOf } from './kotlinColorsOf'
import { kotlinDimensionsOf } from './kotlinDimensionsOf'
import { kotlinTransitionsOf } from './kotlinTransitionsOf'
import { kotlinTypeFamiliesOf } from './kotlinTypeFamiliesOf'
import { kotlinTypographyOf } from './kotlinTypographyOf'

export function designSystemFilesOf(): ReadonlyArray<DesignSystemFile> {
  return [
    kotlinColorsOf(),
    kotlinTypographyOf(),
    kotlinTypeFamiliesOf(),
    ...kotlinDimensionsOf(),
    kotlinTransitionsOf(),
  ]
}
