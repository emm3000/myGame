import type { LexiconEntry } from '../adapters/json/lessonContentFilesOf'
import { framePlacementsOf } from './framePlacementsOf'
import type { GateContent } from './GateContent'
import { grammarSentencesOf } from './grammarSentencesOf'
import { lessonPositionOf } from './lessonPositionOf'
import { textPlacementsOf } from './textPlacementsOf'

export type GrammarPassage = {
  readonly kind: 'frame' | 'text' | 'definition' | 'theme'
  readonly label: string
  readonly lessonId: string
  readonly position: number
  readonly homographs: LexiconEntry['homographs']
  readonly sentences: ReadonlyArray<ReadonlyArray<string>>
}

const lessonPassagesOf = (content: GateContent): ReadonlyArray<GrammarPassage> =>
  content.lessons.flatMap(({ content: lesson, words }) => {
    const placed = {
      lessonId: lesson.id,
      position: lessonPositionOf(content.curriculum, lesson.id),
    }
    const theme: GrammarPassage = {
      ...placed,
      kind: 'theme',
      label: lesson.id,
      homographs: undefined,
      sentences: grammarSentencesOf(lesson.theme),
    }
    const definitions = words.flatMap(
      ({ id, definition, homographs }): ReadonlyArray<GrammarPassage> =>
        definition === undefined
          ? []
          : [
              {
                ...placed,
                kind: 'definition',
                label: id,
                homographs,
                sentences: grammarSentencesOf(definition),
              },
            ],
    )
    return [theme, ...definitions]
  })

export const grammarPassagesOf = (content: GateContent): ReadonlyArray<GrammarPassage> => [
  ...framePlacementsOf(content).frames.map(
    ({ label, lessonId, position, entry, frame }): GrammarPassage => ({
      kind: 'frame',
      label,
      lessonId,
      position,
      homographs: entry.homographs,
      sentences: grammarSentencesOf(frame),
    }),
  ),
  ...textPlacementsOf(content).texts.map(
    ({ label, lessonId, position, text }): GrammarPassage => ({
      kind: 'text',
      label,
      lessonId,
      position,
      homographs: text.homographs,
      sentences: [text.title, ...text.sentences].flatMap((sentence) =>
        grammarSentencesOf(sentence),
      ),
    }),
  ),
  ...lessonPassagesOf(content),
]
