import { screen } from '@testing-library/react'
import type { LineLanguage } from '../design-system/Label'

export const isDrawnAlone =
  (text: string, language: LineLanguage): ((_: string, element: Element | null) => boolean) =>
  (_: string, element: Element | null): boolean =>
    element?.getAttribute('lang') === language &&
    element.textContent === text &&
    element.parentElement?.textContent?.trim() === text

export const linesDrawnAlone = (
  text: string,
  language: LineLanguage,
): Promise<ReadonlyArray<HTMLElement>> => screen.findAllByText(isDrawnAlone(text, language))

export const shownLinesDrawnAlone = (
  text: string,
  language: LineLanguage,
): ReadonlyArray<HTMLElement> => screen.queryAllByText(isDrawnAlone(text, language))

export const shownLinesHolding = (
  text: string,
  language: LineLanguage,
): ReadonlyArray<HTMLElement> =>
  screen.queryAllByText(
    (_, element) =>
      element?.tagName === 'SPAN' &&
      element.getAttribute('lang') === language &&
      (element.textContent ?? '').includes(text),
  )
