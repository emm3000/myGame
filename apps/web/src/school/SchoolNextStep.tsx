import type { NextStep } from '@mygame/contracts'
import type { ReactElement } from 'react'
import { usePlayerCopy } from '../copy/usePlayerCopy'
import { ButtonLink } from '../design-system/ButtonLink'
import { CardAction } from '../design-system/CardAction'
import { FormAlert } from '../design-system/FormAlert'
import { LabelText } from '../design-system/LabelText'
import type { LiveTown } from '../town/liveTown'
import { NextStepBlock } from '../town/NextStepBlock'
import { NextStepLink } from '../town/NextStepLink'
import { type NextStepAction, nextStepCardOf } from '../town/nextStepCardOf'
import { lessonRefusalLineOf } from './lessonRefusalLineOf'
import { releasedRowOf } from './releasedRowOf'
import type { SchoolLessons } from './useSchoolLessons'

type Step<Kind extends NextStep['kind']> = Extract<NextStep, { readonly kind: Kind }>

export interface SchoolNextStepProps {
  readonly town: LiveTown
  readonly lessons: SchoolLessons
}

function ReleasedStepAction({
  step,
  town,
  lessons,
}: SchoolNextStepProps & { readonly step: Step<'releasedLesson'> }): ReactElement | null {
  const copy = usePlayerCopy()
  const lesson = town.overview.releasedLessons.find(({ id }) => id === step.lessonId)
  if (lesson === undefined) {
    return null
  }
  const card = releasedRowOf(lesson, town.overview, copy)
  if (card.state.kind !== 'open') {
    return null
  }
  const refused = lessons.startRefused?.subject === lesson.id ? lessons.startRefused : undefined
  return (
    <>
      <CardAction
        type="button"
        label={card.studyLabel}
        state={card.state.action}
        isWaiting={lessons.isStarting}
        onAction={() => lessons.start(lesson.id)}
      />
      {refused !== undefined && (
        <FormAlert message={lessonRefusalLineOf(refused, town, copy.fixedCopy)} />
      )}
    </>
  )
}

function CheckStepLink({ step }: { readonly step: Step<'holdoutCheck'> }): ReactElement {
  const { fixedCopy } = usePlayerCopy()
  return (
    <ButtonLink
      to="/school/check/$band/$week"
      params={{ band: String(step.band), week: String(step.week) }}
      tone="primary"
    >
      <LabelText label={fixedCopy((catalog) => catalog.schoolHoldoutCheckOpen())} />
    </ButtonLink>
  )
}

function ElsewhereLink({ action }: { readonly action: NextStepAction }): ReactElement | null {
  return action.to === '/school' ? null : <NextStepLink action={action} tone="primary" />
}

function StepAction({
  town,
  lessons,
  action,
}: SchoolNextStepProps & { readonly action: NextStepAction }): ReactElement | null {
  const { nextStep } = town.overview
  switch (nextStep.kind) {
    case 'releasedLesson':
      return <ReleasedStepAction step={nextStep} town={town} lessons={lessons} />
    case 'holdoutCheck':
      return <CheckStepLink step={nextStep} />
    case 'reviews':
    case 'lessonRunning':
    case 'lessonToStudy':
    case 'caughtUp':
      return <ElsewhereLink action={action} />
    default: {
      const unreachable: never = nextStep
      return unreachable
    }
  }
}

export function SchoolNextStep({ town, lessons }: SchoolNextStepProps): ReactElement {
  const content = nextStepCardOf(usePlayerCopy(), town)
  return (
    <div className="flex flex-col gap-5">
      <NextStepBlock content={content} heading="h2" />
      <StepAction town={town} lessons={lessons} action={content.action} />
    </div>
  )
}
