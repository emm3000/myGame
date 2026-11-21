import type { NextStep, NextStepText } from '@mygame/contracts'
import type { ReactElement } from 'react'
import { chromeAroundOf } from '../copy/chromeAroundOf'
import { usePlayerCopy } from '../copy/usePlayerCopy'
import { Button } from '../design-system/Button'
import { hueClassOf } from '../design-system/blockHueOf'
import { LabelText } from '../design-system/LabelText'
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
  const { line, states } = goalLinesOf(usePlayerCopy(), goal)
  return (
    <>
      <p className="m-0 text-body">
        <LabelText label={line} />
      </p>
      {states.map((state) => (
        <p key={state.text} className="m-0 text-body">
          <LabelText label={state} />
        </p>
      ))}
    </>
  )
}

const newestTextOf = (nextStep: NextStep): NextStepText | null =>
  nextStep.kind === 'caughtUp' || nextStep.kind === 'lessonRunning' ? nextStep.text : null

function NewestTextLine({ text }: { readonly text: NextStepText }): ReactElement {
  const copy = usePlayerCopy()
  return (
    <div>
      <TextLink to="/school/texts/$textId" params={{ textId: text.id }}>
        <LabelText
          label={chromeAroundOf(copy, (catalog, title) => catalog.townNextText({ title }), {
            text: text.title,
            language: 'en',
          })}
        />
      </TextLink>
    </div>
  )
}

export function NextStepCard({ town, goal, onGoalClose }: NextStepCardProps): ReactElement {
  const copy = usePlayerCopy()
  const content = nextStepCardOf(copy, town)
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
            <LabelText label={copy.chrome((catalog) => catalog.townGoalClose())} />
          </Button>
        </div>
      )}
    </div>
  )
}
