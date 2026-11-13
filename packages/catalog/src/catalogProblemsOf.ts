import { type MessageFormatElement, parse } from '@formatjs/icu-messageformat-parser'
import { argumentUsesOf } from './argumentUsesOf'
import type { Catalogs, Language } from './Catalogs'
import type { Messages } from './Messages'

export type CatalogProblem =
  | { readonly kind: 'missingFromEs'; readonly key: string }
  | { readonly kind: 'missingFromEn'; readonly key: string }
  | { readonly kind: 'unparsable'; readonly language: Language; readonly key: string }
  | { readonly kind: 'argumentsDiffer'; readonly key: string }
  | { readonly kind: 'voseo'; readonly key: string; readonly word: string }

const voseoForms = [
  'vos',
  'sos',
  'tenés',
  'podés',
  'querés',
  'sabés',
  'hacés',
  'decís',
  'venís',
  'andá',
  'vení',
  'decí',
  'hacé',
  'poné',
  'tené',
  'mirá',
  'volvé',
  'entrá',
  'contá',
]

const voseoPattern = new RegExp(`(?<!\\p{L})(?:${voseoForms.join('|')})(?!\\p{L})`, 'giu')

const parsedOrUndefined = (message: string): MessageFormatElement[] | undefined => {
  try {
    return parse(message)
  } catch {
    return undefined
  }
}

const argumentNamesOf = (message: string): string | undefined => {
  const elements = parsedOrUndefined(message)
  if (elements === undefined) {
    return undefined
  }
  const names = new Set(argumentUsesOf(elements).map(({ name }) => name))
  return [...names].sort().join(',')
}

const missingFromEs = ({ en, es }: Catalogs): ReadonlyArray<CatalogProblem> =>
  Object.keys(en)
    .filter((key) => !(key in es))
    .map((key) => ({ kind: 'missingFromEs', key }))

const missingFromEn = ({ en, es }: Catalogs): ReadonlyArray<CatalogProblem> =>
  Object.keys(es)
    .filter((key) => !(key in en))
    .map((key) => ({ kind: 'missingFromEn', key }))

const unparsable = (language: Language, messages: Messages): ReadonlyArray<CatalogProblem> =>
  Object.entries(messages)
    .filter(([, message]) => parsedOrUndefined(message) === undefined)
    .map(([key]) => ({ kind: 'unparsable', language, key }))

const argumentsDiffer = ({ en, es }: Catalogs): ReadonlyArray<CatalogProblem> =>
  Object.entries(en).flatMap(([key, enMessage]): ReadonlyArray<CatalogProblem> => {
    const esMessage = es[key]
    if (esMessage === undefined) {
      return []
    }
    const enNames = argumentNamesOf(enMessage)
    const esNames = argumentNamesOf(esMessage)
    if (enNames === undefined || esNames === undefined || enNames === esNames) {
      return []
    }
    return [{ kind: 'argumentsDiffer', key }]
  })

const voseo = (es: Messages): ReadonlyArray<CatalogProblem> =>
  Object.entries(es).flatMap(([key, message]) =>
    [...message.matchAll(voseoPattern)].map(
      ([word]): CatalogProblem => ({ kind: 'voseo', key, word }),
    ),
  )

export const catalogProblemsOf = (catalogs: Catalogs): ReadonlyArray<CatalogProblem> => [
  ...missingFromEs(catalogs),
  ...missingFromEn(catalogs),
  ...unparsable('en', catalogs.en),
  ...unparsable('es', catalogs.es),
  ...argumentsDiffer(catalogs),
  ...voseo(catalogs.es),
]
