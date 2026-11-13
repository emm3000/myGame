import { type AndroidModule, androidKeyOf, androidModules, isAndroidKey } from './androidKeyOf'
import type { Catalogs, Language } from './Catalogs'
import type { GeneratedFile } from './GeneratedFile'
import type { Messages } from './Messages'

type AndroidString = {
  readonly module: AndroidModule
  readonly resourceName: string
  readonly pattern: string
}

const moduleDirectoryOf = (module: AndroidModule): string =>
  module === 'app' ? 'apps/android/app' : `apps/android/feature/${module}`

const escapedForAndroid = (pattern: string): string =>
  pattern
    .replaceAll('\\', '\\\\')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll("'", "\\'")
    .replaceAll('"', '\\"')
    .replaceAll('\n', '\\n')
    .replace(/^[@?]/, (leading) => `\\${leading}`)

const resourceLineOf = ({ resourceName, pattern }: AndroidString): string => {
  const formatted = pattern.includes('%') ? ' formatted="false"' : ''
  return `    <string name="${resourceName}"${formatted}>${escapedForAndroid(pattern)}</string>`
}

const stringsXmlOf = (strings: ReadonlyArray<AndroidString>): string =>
  [
    '<?xml version="1.0" encoding="utf-8"?>',
    '<resources>',
    ...strings.map(resourceLineOf),
    '</resources>',
    '',
  ].join('\n')

const androidStringsOf = (messages: Messages): ReadonlyArray<AndroidString> =>
  Object.entries(messages)
    .filter(([key]) => isAndroidKey(key))
    .map(([key, pattern]) => ({ ...androidKeyOf(key), pattern }))
    .sort((left, right) => (left.resourceName < right.resourceName ? -1 : 1))

const valuesDirectoryOf = (language: Language): string =>
  language === 'en' ? 'values' : 'values-es'

const moduleResourcesOf = (
  module: AndroidModule,
  language: Language,
  strings: ReadonlyArray<AndroidString>,
): ReadonlyArray<GeneratedFile> => {
  const moduleStrings = strings.filter((string) => string.module === module)
  if (moduleStrings.length === 0) {
    return []
  }
  return [
    {
      path: `${moduleDirectoryOf(module)}/src/main/res/${valuesDirectoryOf(language)}/strings.xml`,
      contents: stringsXmlOf(moduleStrings),
    },
  ]
}

export const androidResourcesOf = ({ en, es }: Catalogs): ReadonlyArray<GeneratedFile> => {
  const english = androidStringsOf(en)
  const spanish = androidStringsOf(es)
  return androidModules.flatMap((module) => [
    ...moduleResourcesOf(module, 'en', english),
    ...moduleResourcesOf(module, 'es', spanish),
  ])
}
