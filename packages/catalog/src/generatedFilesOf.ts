import { androidResourcesOf } from './androidResourcesOf'
import type { GeneratedFile } from './GeneratedFile'
import type { Messages } from './Messages'
import { typeScriptOf } from './typeScriptOf'

export const generatedFilesOf = (es: Messages): ReadonlyArray<GeneratedFile> => [
  { path: 'packages/catalog/src/generated/es.ts', contents: typeScriptOf(es) },
  ...androidResourcesOf(es),
]
