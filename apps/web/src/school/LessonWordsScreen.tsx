import {
  reportStartReviews,
  schoolLessonNext,
  schoolLessonWordNext,
  schoolLessonWordPosition,
  schoolLessonWordThen,
  schoolSlotTitle,
  townGoToSchool,
  townWorkReady,
} from '@mygame/catalog'
import { type ReactElement, useId } from 'react'
import { Block } from '../design-system/Block'
import { Button } from '../design-system/Button'
import { ButtonLink } from '../design-system/ButtonLink'
import { blockHueOf } from '../design-system/blockClassOf'
import { Countdown } from '../design-system/Countdown'
import { blockFocusTargetClass } from '../design-system/focusTargetClass'
import { PlaceArt } from '../design-system/PlaceArt'
import { TextLink } from '../design-system/TextLink'
import { Track } from '../design-system/Track'
import { useFocusTarget } from '../focus/useFocusTarget'
import type { LessonWord, LessonWords, RunningLesson } from './lessonWordsOf'
import { useWordWalk } from './useWordWalk'
import type { WayOn } from './wayOnOf'

function RunningTime({ running }: { readonly running: RunningLesson }): ReactElement {
  return (
    <div className="flex flex-col gap-2">
      <span className="font-sans text-label text-ink-muted">{schoolSlotTitle()}</span>
      <Countdown
        remainingSeconds={running.remainingSeconds}
        time={running.time}
        finishedLabel={townWorkReady()}
      />
    </div>
  )
}

function WayOnLink({
  wayOn,
  tone,
}: {
  readonly wayOn: WayOn
  readonly tone: 'primary' | 'quiet'
}): ReactElement {
  if (wayOn.kind === 'reviews') {
    return (
      <ButtonLink to="/reviews" tone={tone}>
        {reportStartReviews()}
      </ButtonLink>
    )
  }
  return (
    <ButtonLink to="/school/$lessonId" params={{ lessonId: wayOn.lessonId }} tone={tone}>
      {schoolLessonNext()}
    </ButtonLink>
  )
}

function WordBlock({
  word,
  number,
  count,
  walked,
  headingRef,
}: {
  readonly word: LessonWord
  readonly number: number
  readonly count: number
  readonly walked: number
  readonly headingRef: ReturnType<typeof useFocusTarget<HTMLHeadingElement>>['ref']
}): ReactElement {
  const wordId = useId()
  return (
    <Block hue={blockHueOf(walked)} labelledBy={wordId}>
      <p className="m-0 text-label text-on-block-muted tabular-nums">
        {schoolLessonWordPosition({ number, count })}
      </p>
      {word.art !== undefined && <PlaceArt shapes={word.art} />}
      <h2
        id={wordId}
        ref={headingRef}
        tabIndex={-1}
        lang="en"
        className={`m-0 rounded-sm text-word wrap-anywhere ${blockFocusTargetClass}`}
      >
        {word.word}
      </h2>
      <p lang="es" className="m-0 text-gloss text-on-block-muted wrap-anywhere">
        {word.gloss}
      </p>
      <p lang="en" className="m-0 text-reading wrap-anywhere">
        {word.frame}
      </p>
    </Block>
  )
}

function WordActions({
  isLastWord,
  isRunning,
  wayOn,
  onNextWord,
}: {
  readonly isLastWord: boolean
  readonly isRunning: boolean
  readonly wayOn: WayOn
  readonly onNextWord: () => void
}): ReactElement {
  return (
    <div className="flex flex-col gap-3">
      {!isLastWord && (
        <Button type="button" tone="primary" onClick={onNextWord}>
          {schoolLessonWordNext()}
        </Button>
      )}
      {!isRunning && <WayOnLink wayOn={wayOn} tone={isLastWord ? 'primary' : 'quiet'} />}
      {isRunning && isLastWord && (
        <>
          <p className="m-0 font-sans text-body text-ink">{schoolLessonWordThen()}</p>
          <TextLink to="/school">{townGoToSchool()}</TextLink>
        </>
      )}
    </div>
  )
}

export interface LessonWordsScreenProps {
  readonly lessonId: string
  readonly lesson: LessonWords
  readonly wayOn: WayOn
}

export function LessonWordsScreen({
  lessonId,
  lesson,
  wayOn,
}: LessonWordsScreenProps): ReactElement {
  const { wordIndex, walked, walkOn } = useWordWalk(lessonId)
  const wordHeading = useFocusTarget<HTMLHeadingElement>()
  const { words, running } = lesson
  const lastIndex = words.length - 1
  const shownIndex = Math.min(wordIndex, lastIndex)
  const word = words[shownIndex] ?? words[0]
  const showNextWord = (): void => {
    walkOn(shownIndex + 1)
    wordHeading.focus()
  }
  return (
    <div className="mx-auto flex w-full max-w-form flex-col gap-4">
      <header className="flex flex-col gap-1">
        <h1 className="m-0 font-sans text-title text-ink">{lesson.title}</h1>
        <p lang="en" className="m-0 font-sans text-reading text-ink">
          {lesson.theme}
        </p>
      </header>
      {running !== null && <RunningTime running={running} />}
      <Track value={shownIndex + 1} total={words.length} fillClass="fill-action" />
      <WordBlock
        word={word}
        number={shownIndex + 1}
        count={words.length}
        walked={walked}
        headingRef={wordHeading.ref}
      />
      <WordActions
        isLastWord={shownIndex === lastIndex}
        isRunning={running !== null}
        wayOn={wayOn}
        onNextWord={showNextWord}
      />
    </div>
  )
}
