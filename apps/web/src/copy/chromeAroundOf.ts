import type { Label, LabelLine } from '../design-system/Label'
import type { ChromeCatalog, PlayerCopy } from './PlayerCopy'

const insetMark = '\uE000'

const lineAround = <Line extends LabelLine>(line: Line, inset: LabelLine): Line => {
  const at = line.text.indexOf(insetMark)
  if (at === -1) {
    return line
  }
  return {
    ...line,
    text: line.text.replace(insetMark, () => inset.text),
    inset: { at, text: inset.text, language: inset.language },
  }
}

export function chromeAroundOf(
  { chrome }: PlayerCopy,
  line: (catalog: ChromeCatalog, inset: string) => string,
  inset: LabelLine,
): Label {
  const label = chrome((catalog) => line(catalog, insetMark))
  const { translation } = label
  return {
    ...lineAround(label, inset),
    translation: translation === null ? null : lineAround(translation, inset),
  }
}
