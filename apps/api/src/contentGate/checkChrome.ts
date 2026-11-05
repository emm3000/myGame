import {
  isPluralElement,
  isSelectElement,
  isTagElement,
  type MessageFormatElement,
  parse,
  TYPE,
} from '@formatjs/icu-messageformat-parser'
import { fixedCopyKeys } from './fixedCopyKeys'
import { frameWordsOf } from './frameWordsOf'
import type { GateContent } from './GateContent'
import { tokensOf } from './tokensOf'

const exemptTokens = new Set(['h', 'min', 's', 'townword'])

const textsOf = (elements: ReadonlyArray<MessageFormatElement>): ReadonlyArray<string> =>
  elements.flatMap((element) => {
    if (element.type === TYPE.literal) {
      return [element.value]
    }
    if (isPluralElement(element) || isSelectElement(element)) {
      return Object.values(element.options).flatMap(({ value }) => textsOf(value))
    }
    return isTagElement(element) ? textsOf(element.children) : []
  })

const chromeWordsOf = ({ lessons, curriculum }: GateContent): ReadonlySet<string> =>
  new Set(
    lessons
      .slice(0, curriculum.chromeLessonCount)
      .flatMap(({ words }) => words)
      .flatMap(({ lemma, acceptedForms = [] }) => [lemma, ...acceptedForms])
      .map((form) => form.toLowerCase()),
  )

export const checkChrome = (content: GateContent): ReadonlyArray<string> => {
  const admitted = new Set([...frameWordsOf(content.grammar).keys(), ...chromeWordsOf(content)])
  const isAdmitted = (token: string): boolean =>
    exemptTokens.has(token) ||
    admitted.has(token) ||
    [...(content.forms.get(token) ?? [])].some((word) => admitted.has(word))
  return Object.entries(content.englishMessages)
    .filter(([key]) => !fixedCopyKeys.has(key))
    .flatMap(([key, message]) =>
      textsOf(parse(message))
        .flatMap((text) => tokensOf(text))
        .filter((token) => !isAdmitted(token))
        .map((token) => `${key}: holds ${token}, a card word no chrome lesson teaches`),
    )
}
