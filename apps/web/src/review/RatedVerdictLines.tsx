import { type ReactElement, type Ref, useId } from 'react'
import { copy } from '../copy'
import { Button } from '../design-system/Button'
import { focusTargetClass } from '../design-system/focusTargetClass'
import type { EarnedSkill } from './earnedSkillOf'
import type { GivenAnswer } from './useReview'

export interface RatedVerdictLinesProps {
  readonly answered: GivenAnswer
  readonly answerLang: 'en' | 'es'
  readonly skill: EarnedSkill | undefined
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
      <p className="m-0 font-body text-body text-ink">
        {copy.review.yourAnswer} <span lang={answerLang}>{answered.given}</span>
      </p>
      <p className="m-0 font-body text-body text-ink">
        {copy.review.rightAnswer}{' '}
        <b lang={answerLang} className="font-bold">
          {correctForm}
        </b>
      </p>
      <p className="m-0 font-body text-caption text-ink">{copy.review.comesBack}</p>
    </>
  )
}

function SkillLines({ skill }: { readonly skill: EarnedSkill }): ReactElement {
  return (
    <>
      <p className="m-0 font-body font-bold text-body text-ink">
        {copy.review.skillEarned(skill.resource, skill.level)}
      </p>
      <p className="m-0 font-body text-caption text-ink">
        {copy.review.skillRate(skill.ratePercent, skill.resource)}
      </p>
    </>
  )
}

export function RatedVerdictLines({
  answered,
  answerLang,
  skill,
  verdictRef,
  onNext,
}: RatedVerdictLinesProps): ReactElement {
  const lineId = useId()
  const isCorrect = answered.verdict.kind === 'correct'
  const tone = isCorrect ? 'border-moss bg-moss-soft' : 'border-rust bg-rust-soft'
  return (
    <div className="flex flex-col gap-3">
      <section
        ref={verdictRef}
        aria-labelledby={lineId}
        tabIndex={-1}
        className={`flex flex-col gap-2 rounded-md border px-3 py-2 ${tone} ${focusTargetClass}`}
      >
        <p id={lineId} className="m-0 font-body font-bold text-body text-ink">
          {isCorrect ? copy.review.correct : copy.review.wrong}
        </p>
        {!isCorrect && <WrongLines answered={answered} answerLang={answerLang} />}
        {skill !== undefined && <SkillLines skill={skill} />}
      </section>
      <Button type="button" tone="primary" onClick={onNext}>
        {copy.review.next}
      </Button>
    </div>
  )
}
