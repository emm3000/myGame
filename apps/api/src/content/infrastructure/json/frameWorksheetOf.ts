import type { LexiconContent } from '@mygame/contracts'
import type { LessonContentFiles, LexiconEntry } from './readLessonContentFiles'

type Frame = LexiconEntry['frames'][number]

type WorksheetContent = Pick<LessonContentFiles, 'lessons' | 'lexicon'>

const gap = '____'

const header = [
  '| Word | Frame | Gloss (es) | Definition | Anchor | Other lesson words in the gap | Mark |',
  '|---|---|---|---|---|---|---|',
]

const isSameFrame = (one: Frame, other: Frame): boolean =>
  one.frame === other.frame && one.gappedFrame === other.gappedFrame

const isNewFrame = (entry: LexiconEntry, frame: Frame, base: LexiconContent): boolean =>
  !(base.find(({ id }) => id === entry.id)?.frames ?? []).some((known) => isSameFrame(known, frame))

const filledGap = (gappedFrame: string, lemma: string): string => {
  const [opening = '', ...rest] = gappedFrame.split(gap)
  const words = lemma.split(' ')
  return rest.reduce((filled, after, index) => {
    const isLastGap = index === rest.length - 1
    const filler = isLastGap ? words.slice(index).join(' ') : words[index]
    return `${filled}${filler === undefined || filler === '' ? gap : filler}${after}`
  }, opening)
}

const otherLessonWordsOf = (
  entry: LexiconEntry,
  { lessons }: WorksheetContent,
): ReadonlyArray<LexiconEntry> =>
  (lessons.find(({ content }) => content.wordIds.includes(entry.id))?.words ?? []).filter(
    ({ id }) => id !== entry.id,
  )

const rowOf = (entry: LexiconEntry, frame: Frame, content: WorksheetContent): string =>
  `| ${[
    entry.lemma,
    frame.frame,
    entry.gloss.es ?? '',
    entry.definition ?? '',
    entry.frames[0].frame,
    otherLessonWordsOf(entry, content)
      .map(({ lemma }) => filledGap(frame.gappedFrame, lemma))
      .join('<br>'),
    '',
  ].join(' | ')} |`

export const frameWorksheetOf = (content: WorksheetContent, base: LexiconContent): string =>
  [
    ...header,
    ...content.lexicon.flatMap((entry) =>
      entry.frames
        .filter((frame) => isNewFrame(entry, frame, base))
        .map((frame) => rowOf(entry, frame, content)),
    ),
  ].join('\n')
