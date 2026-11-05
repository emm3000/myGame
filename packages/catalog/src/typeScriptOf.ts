import {
  type MessageFormatElement,
  type PluralElement,
  type PluralOrSelectOption,
  parse,
  type SelectElement,
  TYPE,
} from '@formatjs/icu-messageformat-parser'
import { isAndroidKey } from './androidKeyOf'
import { type ArgumentUse, argumentUsesOf } from './argumentUsesOf'
import type { Messages } from './Messages'

type Branch = {
  readonly condition: string
  readonly elements: ReadonlyArray<MessageFormatElement>
}

const keyShape = /^[a-z][a-zA-Z0-9]*(?:\.[a-zA-Z][a-zA-Z0-9]*)*$/

const exactSelector = /^=(\d+)$/

const functionNameOf = (key: string): string =>
  key
    .split('.')
    .map((segment, index) =>
      index === 0 ? segment : segment.charAt(0).toUpperCase() + segment.slice(1),
    )
    .join('')

const escapedForTemplate = (text: string): string =>
  text
    .replaceAll('\\', '\\\\')
    .replaceAll('`', '\\`')
    .replaceAll('${', '\\${')
    .replaceAll('\n', '\\n')
    .replaceAll('\r', '\\r')

const quoted = (option: string): string =>
  `'${option.replaceAll('\\', '\\\\').replaceAll("'", "\\'")}'`

const explicitOptionsOf = (
  options: Readonly<Record<string, PluralOrSelectOption>>,
): ReadonlyArray<[string, PluralOrSelectOption]> =>
  Object.entries(options).filter(([selector]) => selector !== 'other')

const choiceOf = (
  key: string,
  branches: ReadonlyArray<Branch>,
  other: ReadonlyArray<MessageFormatElement>,
  pound: string | undefined,
): string => {
  const tests = branches.map(
    ({ condition, elements }) => `${condition} ? \`${templateOf(key, elements, pound)}\` : `,
  )
  return `\${${tests.join('')}\`${templateOf(key, other, pound)}\`}`
}

const exactBranchOf = (
  key: string,
  element: PluralElement,
  [selector, option]: [string, PluralOrSelectOption],
): Branch => {
  const value = exactSelector.exec(selector)?.[1]
  if (value === undefined) {
    throw new Error(`${key}: ${element.value} uses ${selector}; only =N and other are accepted`)
  }
  return { condition: `${element.value} === ${value}`, elements: option.value }
}

const pluralOf = (key: string, element: PluralElement): string => {
  if (element.offset !== 0 || element.pluralType !== 'cardinal') {
    throw new Error(`${key}: ${element.value} is a plural with an offset or an ordinal`)
  }
  const branches = explicitOptionsOf(element.options).map((option) =>
    exactBranchOf(key, element, option),
  )
  return choiceOf(key, branches, element.options.other?.value ?? [], element.value)
}

const selectOf = (key: string, element: SelectElement, pound: string | undefined): string => {
  const branches = explicitOptionsOf(element.options).map(([option, { value }]) => ({
    condition: `${element.value} === ${quoted(option)}`,
    elements: value,
  }))
  return choiceOf(key, branches, element.options.other?.value ?? [], pound)
}

const pieceOf = (key: string, element: MessageFormatElement, pound: string | undefined): string => {
  switch (element.type) {
    case TYPE.literal:
      return escapedForTemplate(element.value)
    case TYPE.argument:
      return `\${String(${element.value})}`
    case TYPE.pound:
      return pound === undefined ? '#' : `\${String(${pound})}`
    case TYPE.plural:
      return pluralOf(key, element)
    case TYPE.select:
      return selectOf(key, element, pound)
    case TYPE.number:
    case TYPE.date:
    case TYPE.time:
    case TYPE.tag:
      throw new Error(`${key}: ${element.value} uses an ICU form the catalog does not generate`)
    default: {
      const unreachable: never = element
      return unreachable
    }
  }
}

const templateOf = (
  key: string,
  elements: ReadonlyArray<MessageFormatElement>,
  pound: string | undefined,
): string => elements.map((element) => pieceOf(key, element, pound)).join('')

const typeOf = (key: string, use: ArgumentUse): string => {
  switch (use.role) {
    case 'text':
      return 'string | number'
    case 'plural':
      return 'number'
    case 'select':
      return use.options.map(quoted).join(' | ')
    case 'number':
    case 'date':
    case 'time':
    case 'tag':
      throw new Error(`${key}: ${use.name} uses an ICU form the catalog does not generate`)
    default: {
      const unreachable: never = use
      return unreachable
    }
  }
}

const argumentsByNameOf = (
  key: string,
  elements: ReadonlyArray<MessageFormatElement>,
): ReadonlyArray<ArgumentUse> => {
  const uses = new Map<string, ArgumentUse>()
  for (const use of argumentUsesOf(elements)) {
    const known = uses.get(use.name)
    if (known !== undefined && known.role !== use.role) {
      throw new Error(`${key}: ${use.name} is used as ${known.role} and as ${use.role}`)
    }
    uses.set(use.name, use)
  }
  return [...uses.values()].sort((left, right) => (left.name < right.name ? -1 : 1))
}

const parametersOf = (key: string, elements: ReadonlyArray<MessageFormatElement>): string => {
  const uses = argumentsByNameOf(key, elements)
  if (uses.length === 0) {
    return '()'
  }
  const names = uses.map(({ name }) => name).join(', ')
  const types = uses.map((use) => `readonly ${use.name}: ${typeOf(key, use)}`).join('; ')
  return `({ ${names} }: { ${types} })`
}

const parsed = (key: string, message: string): MessageFormatElement[] => {
  try {
    return parse(message)
  } catch {
    throw new Error(`${key}: the message does not parse`)
  }
}

const functionOf = ([key, message]: [string, string]): string => {
  if (!keyShape.test(key)) {
    throw new Error(`${key}: a key is dotted camelCase segments`)
  }
  const elements = parsed(key, message)
  const body = templateOf(key, elements, undefined)
  const parameters = parametersOf(key, elements)
  return `export const ${functionNameOf(key)} = ${parameters}: string => \`${body}\`\n`
}

export const typeScriptOf = (messages: Messages): string => {
  const entries = Object.entries(messages)
    .filter(([key]) => !isAndroidKey(key))
    .sort(([left], [right]) => (left < right ? -1 : 1))
  return entries.length === 0 ? 'export {}\n' : entries.map(functionOf).join('')
}
