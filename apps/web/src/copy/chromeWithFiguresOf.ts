import type { Label, LabelFigure, LabelLine } from '../design-system/Label'
import type { ChromeCatalog, PlayerCopy } from './PlayerCopy'

const figureOpen = ''
const figureClose = ''
const figureMark = new RegExp(`${figureOpen}([^${figureClose}]*)${figureClose}`)

const figureOf = (text: string): string => `${figureOpen}${text}${figureClose}`

const lineWithFigures = <Line extends LabelLine>(line: Line): Line => {
  const pieces = line.text.split(figureMark)
  if (pieces.length === 1) {
    return line
  }
  const { text, figures } = pieces.reduce<{
    readonly text: string
    readonly figures: ReadonlyArray<LabelFigure>
  }>(
    (drawn, piece, index) => ({
      text: drawn.text + piece,
      figures:
        index % 2 === 1
          ? [...drawn.figures, { at: drawn.text.length, text: piece }]
          : drawn.figures,
    }),
    { text: '', figures: [] },
  )
  return { ...line, text, figures }
}

export function chromeWithFiguresOf(
  { chrome }: PlayerCopy,
  line: (catalog: ChromeCatalog, figure: (text: string) => string) => string,
): Label {
  const label = chrome((catalog) => line(catalog, figureOf))
  const { translation } = label
  return {
    ...lineWithFigures(label),
    translation: translation === null ? null : lineWithFigures(translation),
  }
}
