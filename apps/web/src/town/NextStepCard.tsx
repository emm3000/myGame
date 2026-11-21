import { townGoalClose, townNextText } from '@mygame/catalog'
import type { NextStep } from '@mygame/contracts'
import type { ReactElement } from 'react'
import { Button } from '../design-system/Button'
import { hueClassOf } from '../design-system/blockHueOf'
import { TextLink } from '../design-system/TextLink'
import { useFocusTarget } from '../focus/useFocusTarget'
import { goalLinesOf } from './goalLinesOf'
import type { LiveTown } from './liveTown'
import { NextStepBlock } from './NextStepBlock'
import { NextStepLink } from './NextStepLink'
import { nextStepCardOf } from './nextStepCardOf'
import type { TownGoal } from './TownGoal'

const stackedBlockClass = 'absolute inset-0 -z-10 rounded-lg'

export interface NextStepCardProps {
  readonly town: LiveTown
  readonly goal: TownGoal | null
  readonly onGoalClose: () => void
}

function GoalLines({ goal }: { readonly goal: TownGoal }): ReactElement {
  const { line, states } = goalLinesOf(goal)
  return (
    <>
      <p className="m-0 text-body">{line}</p>
      {states.map((state) => (
        <p key={state} className="m-0 text-body">
          {state}
        </p>
      ))}
    </>
  )
}

type NewestText = NonNullable<Extract<NextStep, { readonly kind: 'caughtUp' }>['text']>

const newestTextOf = (nextStep: NextStep): NewestText | null =>
  nextStep.kind === 'caughtUp' || nextStep.kind === 'lessonRunning' ? nextStep.text : null

function NewestTextLine({ text }: { readonly text: NewestText }): ReactElement {
  return (
    <div>
      <TextLink to="/school/texts/$textId" params={{ textId: text.id }}>
        {townNextText({ title: text.title })}
      </TextLink>
    </div>
  )
}

export function NextStepCard({ town, goal, onGoalClose }: NextStepCardProps): ReactElement {
  const content = nextStepCardOf(town)
  const text = newestTextOf(town.overview.nextStep)
  const heading = useFocusTarget<HTMLHeadingElement>()
  const closeGoal = (): void => {
    onGoalClose()
    heading.focus()
  }
  return (
    <div className="flex flex-col gap-5">
      <div className="relative isolate">
        <div aria-hidden="true" className={`${stackedBlockClass} rotate-2 ${hueClassOf('mint')}`} />
        <div
          aria-hidden="true"
          className={`${stackedBlockClass} -rotate-2 ${hueClassOf('lavender')}`}
        />
        <NextStepBlock content={content} heading="h3" headingRef={heading.ref}>
          {goal !== null && <GoalLines goal={goal} />}
        </NextStepBlock>
      </div>
      {text !== null && <NewestTextLine text={text} />}
      <NextStepLink action={content.action} tone="primary" />
      {goal !== null && (
        <div>
          <Button type="button" tone="text" onClick={closeGoal}>
            {townGoalClose()}
          </Button>
        </div>
      )}
    </div>
  )
}
