import type { FrameToken } from '../FrameToken'
import type { Text, TextId } from '../Text'

export interface TextCatalog {
  texts(): ReadonlyArray<Text>
  textTokensOf(textId: TextId, passage: string): ReadonlyArray<FrameToken> | undefined
}
