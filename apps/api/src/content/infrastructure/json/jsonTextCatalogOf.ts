import type { TextCatalog } from '@mygame/domain'
import type { LessonShelf } from './LessonShelf'

export const jsonTextCatalogOf = ({ texts, resolvedFrames }: LessonShelf): TextCatalog => ({
  texts: () => texts,
  textTokensOf: (textId, passage) => resolvedFrames.textTokens.get(textId)?.get(passage),
})
