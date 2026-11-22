import type { FrameLearner } from './FrameLearner'
import type { FrameSpans } from './FrameSpan'
import { frameSpansOf, withholdingNothing } from './frameSpansOf'
import type { TextCatalog } from './ports/TextCatalog'
import type { Text, TextId } from './Text'

export type TextReading = {
  readonly id: TextId
  readonly title: string
  readonly sentences: ReadonlyArray<FrameSpans>
}

export const textReadingOf = (
  { id, title, sentences }: Text,
  learner: FrameLearner,
  texts: Pick<TextCatalog, 'textTokensOf'>,
): TextReading => ({
  id,
  title,
  sentences: sentences.map((sentence) =>
    frameSpansOf(sentence, texts.textTokensOf(id, sentence), learner, withholdingNothing),
  ),
})
