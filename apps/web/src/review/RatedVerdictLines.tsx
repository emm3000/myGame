import {
  reviewComesBack,
  reviewCorrect,
  reviewNext,
  reviewRightAnswer,
  reviewSkillEarned,
  reviewSkillRate,
  reviewSkillWords,
  reviewWrong,
  reviewYourAnswer,
} from '@mygame/catalog'
import type { RaisedSkill } from '@mygame/contracts'
import { type ReactElement, type Ref, useId } from 'react'
import { Button } from '../design-system/Button'
import { focusTargetClass } from '../design-system/focusTargetClass'
import { CheckIcon } from '../design-system/icons/CheckIcon'
import { CrossIcon } from '../design-system/icons/CrossIcon'
import { townResourceNameOf } from '../resources/townResourceNameOf'
import { skillRatesLineOf } from './skillRatesLineOf'
import type { GivenAnswer } from './useReview'

export interface RatedVerdictLinesProps {
  readonly answered: GivenAnswer
  readonly answerLang: 'en' | 'es'
  readonly verdictRef: Ref<HTMLElement>
  readonly onNext: () => void
}

function WrongLines({
  answered,
  answerLang,
}: Pick<RatedVerdictLinesProps, 'answered' | 'answerLang'>): ReactElement {
  const { verdict } = answered
  const correctForm = answerLang === 'en' ? verdict.word : verdict.gloss
  return (
    <>
      <p className="m-0 font-sans text-body text-ink">
        {reviewYourAnswer()} <span lang={answerLang}>{answered.given}</span>
      </p>
      <p className="m-0 font-sans text-body text-ink">
        {reviewRightAnswer()}{' '}
        <b lang={answerLang} className="font-bold">
          {correctForm}
        </b>
      </p>
      <p className="m-0 font-sans text-caption text-ink">{reviewComesBack()}</p>
    </>
  )
}

function RatesLine({ skill }: { readonly skill: RaisedSkill }): ReactElement | null {
  const { ratePerHourBefore, ratePerHourAfter } = skill
  if (ratePerHourBefore === null || ratePerHourAfter === null) {
    return null
  }
  return (
    <p
      data-registers="rate"
      className="m-0 font-sans text-body text-ink tabular-nums motion-safe:transition-rate motion-safe:starting:opacity-0"
    >
      {skillRatesLineOf(skill.resource, ratePerHourBefore, ratePerHourAfter)}
    </p>
  )
}

function SkillLines({ skill }: { readonly skill: RaisedSkill }): ReactElement {
  return (
    <>
      <p className="m-0 font-sans text-title text-ink">
        {reviewSkillEarned({ resource: townResourceNameOf(skill.resource), level: skill.level })}
      </p>
      <p className="m-0 font-sans text-caption text-ink">
        {reviewSkillRate({
          percent: skill.ratePercent,
          resource: townResourceNameOf(skill.resource),
        })}
      </p>
      <RatesLine skill={skill} />
      <p className="m-0 font-sans text-body text-ink">
        {reviewSkillWords()} <span lang="en">{skill.words.join(', ')}</span>
      </p>
    </>
  )
}

export function RatedVerdictLines({
  answered,
  answerLang,
  verdictRef,
  onNext,
}: RatedVerdictLinesProps): ReactElement {
  const lineId = useId()
  const { verdict } = answered
  const isCorrect = verdict.kind === 'correct'
  const skill = verdict.kind === 'correct' ? verdict.earnedSkill : null
  return (
    <div className="flex flex-col gap-3">
      <section
        ref={verdictRef}
        aria-labelledby={lineId}
        tabIndex={-1}
        className={`flex flex-col gap-2 rounded-md ${focusTargetClass}`}
      >
        <div className="flex items-center gap-2 text-ink">
          {isCorrect ? <CheckIcon sizeClass="size-icon" /> : <CrossIcon sizeClass="size-icon" />}
          <p id={lineId} className="m-0 font-sans text-title text-ink">
            {isCorrect ? reviewCorrect() : reviewWrong()}
          </p>
        </div>
        {!isCorrect && <WrongLines answered={answered} answerLang={answerLang} />}
        {skill !== null && <SkillLines skill={skill} />}
      </section>
      <Button type="button" tone="primary" onClick={onNext}>
        {reviewNext()}
      </Button>
    </div>
  )
}
