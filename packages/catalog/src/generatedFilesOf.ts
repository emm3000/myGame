import { androidResourcesOf } from './androidResourcesOf'
import type { Catalogs } from './Catalogs'
import type { GeneratedFile } from './GeneratedFile'
import { typeScriptOf } from './typeScriptOf'

export const generatedFilesOf = (catalogs: Catalogs): ReadonlyArray<GeneratedFile> => [
  { path: 'packages/catalog/src/generated/es.ts', contents: typeScriptOf(catalogs.es) },
  ...androidResourcesOf(catalogs),
]
