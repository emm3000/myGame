import type { TextCatalog } from '../ports/TextCatalog'
import type { FrameReader } from './FrameReader'
import type { FrameSpans } from './FrameSpan'
import { frameSpansOf } from './frameSpansOf'
import type { Text, TextId } from './Text'

export type TextReading = {
  readonly id: TextId
  readonly title: string
  readonly sentences: ReadonlyArray<FrameSpans>
}

const withholdingNothing = (): boolean => false

export const textReadingOf = (
  { id, title, sentences }: Text,
  reader: FrameReader,
  texts: Pick<TextCatalog, 'textTokensOf'>,
): TextReading => ({
  id,
  title,
  sentences: sentences.map((sentence) =>
    frameSpansOf(sentence, texts.textTokensOf(id, sentence), reader, withholdingNothing),
  ),
})
