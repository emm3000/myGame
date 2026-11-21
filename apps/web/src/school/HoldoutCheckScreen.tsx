import {
  holdoutCheckDone,
  holdoutCheckDueLine,
  holdoutCheckFailed,
  holdoutCheckRefusalInvalid,
  holdoutCheckRefused,
  holdoutCheckSend,
  holdoutCheckSkip,
  holdoutCheckSkipLine,
  holdoutCheckSkipped,
  holdoutCheckStart,
  holdoutCheckTitle,
  placementBand,
  placementChoose,
  placementNext,
  placementProgress,
  placementPrompt,
  placementRetry,
  refusalUnexpected,
  townGoToSchool,
} from '@mygame/catalog'
import type { HoldoutCheckRequest } from '@mygame/contracts'
import { type ReactElement, type ReactNode, useId } from 'react'
import { Button, type ButtonAvailability } from '../design-system/Button'
import { ChoiceWalk } from '../design-system/ChoiceWalk'
import { FormAlert } from '../design-system/FormAlert'
import { ReadFailed } from '../design-system/ReadFailed'
import { TextLink } from '../design-system/TextLink'
import type {
  HoldoutCheckAction,
  HoldoutCheckAlert,
  HoldoutCheckHandle,
  HoldoutCheckView,
} from './useHoldoutCheck'

type AskingView = Extract<HoldoutCheckView, { readonly kind: 'asking' }>

const alertLines: Readonly<Record<HoldoutCheckAlert, () => string>> = {
  notOpen: holdoutCheckRefused,
  invalidAnswers: holdoutCheckRefusalInvalid,
  unreachable: refusalUnexpected,
}

export function HoldoutCheckTitled({ children }: { readonly children: ReactNode }): ReactElement {
  const titleId = useId()
  return (
    <section aria-labelledby={titleId} className="flex max-w-form flex-col gap-6">
      <h1 id={titleId} className="m-0 font-sans text-display text-ink">
        {holdoutCheckTitle()}
      </h1>
      {children}
    </section>
  )
}

const availabilityOf = (
  action: HoldoutCheckAction,
  waiting: HoldoutCheckAction | undefined,
): ButtonAvailability => {
  if (waiting === undefined) {
    return 'available'
  }
  return waiting === action ? 'waiting' : 'blocked'
}

function CheckAlert({
  alert,
}: {
  readonly alert: HoldoutCheckAlert | undefined
}): ReactElement | null {
  return alert === undefined ? null : <FormAlert message={alertLines[alert]()} />
}

function CheckDue({
  due,
  handle,
}: {
  readonly due: HoldoutCheckRequest
  readonly handle: HoldoutCheckHandle
}): ReactElement {
  return (
    <div className="flex flex-col gap-4 font-sans">
      <p className="m-0 text-body text-ink">{holdoutCheckDueLine(due)}</p>
      <p className="m-0 text-body text-ink-muted">{holdoutCheckSkipLine()}</p>
      <CheckAlert alert={handle.alert} />
      <Button
        type="button"
        tone="primary"
        availability={availabilityOf('begin', handle.waiting)}
        onClick={handle.begin}
      >
        {holdoutCheckStart()}
      </Button>
      <Button
        type="button"
        tone="quiet"
        availability={availabilityOf('skip', handle.waiting)}
        onClick={handle.skip}
      >
        {holdoutCheckSkip()}
      </Button>
    </div>
  )
}

function CheckAsking({
  asking,
  handle,
}: {
  readonly asking: AskingView
  readonly handle: HoldoutCheckHandle
}): ReactElement {
  return (
    <div className="flex flex-col gap-4">
      <ChoiceWalk
        items={asking.check.items}
        lines={{
          heading: placementBand({ band: asking.check.band }),
          prompt: placementPrompt(),
          next: placementNext(),
          choose: placementChoose(),
          send: holdoutCheckSend(),
          progressOf: (number, total) => placementProgress({ number, total }),
        }}
        isSending={handle.waiting === 'answers'}
        onSend={(answers) => handle.send({ answers: [...answers] })}
      />
      <CheckAlert alert={handle.alert} />
    </div>
  )
}

function CheckEnd({ line }: { readonly line: string }): ReactElement {
  return (
    <div className="flex flex-col items-start gap-4">
      <p role="status" className="m-0 font-sans text-body text-ink">
        {line}
      </p>
      <TextLink to="/school">{townGoToSchool()}</TextLink>
    </div>
  )
}

function CheckRead({
  handle,
  view,
}: {
  readonly handle: HoldoutCheckHandle
  readonly view: Exclude<HoldoutCheckView, { readonly kind: 'loading' }>
}): ReactElement {
  switch (view.kind) {
    case 'failed':
      return (
        <ReadFailed
          message={holdoutCheckFailed()}
          retryLabel={placementRetry()}
          onRetry={handle.reread}
        />
      )
    case 'notOpen':
      return <CheckEnd line={holdoutCheckRefused()} />
    case 'due':
      return <CheckDue due={view.check} handle={handle} />
    case 'asking':
      return <CheckAsking asking={view} handle={handle} />
    case 'done':
      return <CheckEnd line={holdoutCheckDone()} />
    case 'skipped':
      return <CheckEnd line={holdoutCheckSkipped()} />
    default: {
      const unreachable: never = view
      return unreachable
    }
  }
}

export function HoldoutCheckScreen({
  handle,
}: {
  readonly handle: HoldoutCheckHandle
}): ReactElement | null {
  const { view } = handle
  if (view.kind === 'loading') {
    return null
  }
  return (
    <HoldoutCheckTitled>
      <CheckRead handle={handle} view={view} />
    </HoldoutCheckTitled>
  )
}
