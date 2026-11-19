import type { FrameToken } from '../learning/FrameToken'
import type { Text, TextId } from '../learning/Text'

export interface TextCatalog {
  texts(): ReadonlyArray<Text>
  textTokensOf(textId: TextId, passage: string): ReadonlyArray<FrameToken> | undefined
}
