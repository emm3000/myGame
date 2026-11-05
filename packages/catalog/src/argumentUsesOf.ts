import { type MessageFormatElement, TYPE } from '@formatjs/icu-messageformat-parser'

export type ArgumentUse =
  | { readonly name: string; readonly role: 'text' | 'plural' | 'number' | 'date' | 'time' | 'tag' }
  | { readonly name: string; readonly role: 'select'; readonly options: ReadonlyArray<string> }

const optionUsesOf = (
  options: Readonly<Record<string, { readonly value: MessageFormatElement[] }>>,
): ReadonlyArray<ArgumentUse> =>
  Object.values(options).flatMap(({ value }) => argumentUsesOf(value))

const usesOf = (element: MessageFormatElement): ReadonlyArray<ArgumentUse> => {
  switch (element.type) {
    case TYPE.literal:
    case TYPE.pound:
      return []
    case TYPE.argument:
      return [{ name: element.value, role: 'text' }]
    case TYPE.number:
      return [{ name: element.value, role: 'number' }]
    case TYPE.date:
      return [{ name: element.value, role: 'date' }]
    case TYPE.time:
      return [{ name: element.value, role: 'time' }]
    case TYPE.tag:
      return [{ name: element.value, role: 'tag' }, ...argumentUsesOf(element.children)]
    case TYPE.plural:
      return [{ name: element.value, role: 'plural' }, ...optionUsesOf(element.options)]
    case TYPE.select: {
      const options = Object.keys(element.options).filter((option) => option !== 'other')
      return [{ name: element.value, role: 'select', options }, ...optionUsesOf(element.options)]
    }
    default: {
      const unreachable: never = element
      return unreachable
    }
  }
}

export const argumentUsesOf = (
  elements: ReadonlyArray<MessageFormatElement>,
): ReadonlyArray<ArgumentUse> => elements.flatMap(usesOf)
