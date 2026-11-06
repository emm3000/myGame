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
import { type ReactElement, useState } from 'react'
import { Button } from '../design-system/Button'
import { ButtonLink } from '../design-system/ButtonLink'
import { CardArt } from '../design-system/CardArt'
import { Countdown } from '../design-system/Countdown'
import { focusTargetClass } from '../design-system/focusTargetClass'
import { Panel } from '../design-system/Panel'
import { TextLink } from '../design-system/TextLink'
import { Track } from '../design-system/Track'
import { useFocusTarget } from '../focus/useFocusTarget'
import type { LessonWord, LessonWords, RunningLesson } from './lessonWordsOf'
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
      <Track
        value={running.totalSeconds - running.remainingSeconds}
        total={running.totalSeconds}
        fillClass="fill-action"
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

function WordCard({
  word,
  number,
  count,
  headingRef,
}: {
  readonly word: LessonWord
  readonly number: number
  readonly count: number
  readonly headingRef: ReturnType<typeof useFocusTarget<HTMLHeadingElement>>['ref']
}): ReactElement {
  return (
    <Panel
      element="article"
      toneClass="bg-surface-raised"
      spacingClass="items-center gap-2 p-5 text-center"
    >
      <p className="m-0 font-sans text-label text-ink-muted tabular-nums">
        {schoolLessonWordPosition({ number, count })}
      </p>
      {word.art !== undefined && <CardArt src={word.art} shape="square" />}
      <h3
        ref={headingRef}
        tabIndex={-1}
        lang="en"
        className={`m-0 font-sans text-word text-ink ${focusTargetClass}`}
      >
        {word.word}
      </h3>
      <p lang="es" className="m-0 rounded-md bg-gloss-soft px-2 font-sans text-gloss text-ink">
        {word.gloss}
      </p>
      <p lang="en" className="m-0 font-sans text-reading text-ink">
        {word.frame}
      </p>
    </Panel>
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
    <div className="flex flex-wrap items-center gap-3">
      {!isLastWord && (
        <Button type="button" tone="primary" onClick={onNextWord}>
          {schoolLessonWordNext()}
        </Button>
      )}
      {!isRunning && <WayOnLink wayOn={wayOn} tone={isLastWord ? 'primary' : 'quiet'} />}
      {isRunning && isLastWord && (
        <>
          <p className="m-0 w-full font-sans text-body text-ink">{schoolLessonWordThen()}</p>
          <TextLink to="/school">{townGoToSchool()}</TextLink>
        </>
      )}
    </div>
  )
}

export interface LessonWordsScreenProps {
  readonly lesson: LessonWords
  readonly wayOn: WayOn
}

export function LessonWordsScreen({ lesson, wayOn }: LessonWordsScreenProps): ReactElement {
  const [wordIndex, setWordIndex] = useState(0)
  const wordHeading = useFocusTarget<HTMLHeadingElement>()
  const { words, running } = lesson
  const lastIndex = words.length - 1
  const shownIndex = Math.min(wordIndex, lastIndex)
  const word = words[shownIndex] ?? words[0]
  const showNextWord = (): void => {
    setWordIndex(shownIndex + 1)
    wordHeading.focus()
  }
  return (
    <div className="mx-auto flex w-full max-w-form flex-col gap-4">
      <header className="flex flex-col gap-1">
        <h2 className="m-0 font-sans text-title text-ink">{lesson.title}</h2>
        <p lang="en" className="m-0 font-sans text-reading text-ink">
          {lesson.theme}
        </p>
      </header>
      {running !== null && <RunningTime running={running} />}
      <WordCard
        word={word}
        number={shownIndex + 1}
        count={words.length}
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
