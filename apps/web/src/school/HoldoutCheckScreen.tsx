import type { HoldoutCheckRequest } from '@mygame/contracts'
import { type ReactElement, type ReactNode, useId } from 'react'
import type { FixedCopyCatalog } from '../copy/PlayerCopy'
import { usePlayerCopy } from '../copy/usePlayerCopy'
import { Button, type ButtonAvailability } from '../design-system/Button'
import { ChoiceWalk } from '../design-system/ChoiceWalk'
import { FormAlert } from '../design-system/FormAlert'
import type { Label } from '../design-system/Label'
import { LabelText } from '../design-system/LabelText'
import { ReadFailed } from '../design-system/ReadFailed'
import { TextLink } from '../design-system/TextLink'
import type {
  HoldoutCheckAction,
  HoldoutCheckAlert,
  HoldoutCheckHandle,
  HoldoutCheckView,
} from './useHoldoutCheck'

type AskingView = Extract<HoldoutCheckView, { readonly kind: 'asking' }>

const alertLines: Readonly<Record<HoldoutCheckAlert, (catalog: FixedCopyCatalog) => string>> = {
  notOpen: (catalog) => catalog.holdoutCheckRefused(),
  invalidAnswers: (catalog) => catalog.holdoutCheckRefusalInvalid(),
  unreachable: (catalog) => catalog.refusalUnexpected(),
}

export function HoldoutCheckTitled({ children }: { readonly children: ReactNode }): ReactElement {
  const titleId = useId()
  const { fixedCopy } = usePlayerCopy()
  return (
    <section aria-labelledby={titleId} className="flex max-w-form flex-col gap-6">
      <h1 id={titleId} className="m-0 font-sans text-display text-ink">
        <LabelText label={fixedCopy((catalog) => catalog.holdoutCheckTitle())} />
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
  const { fixedCopy } = usePlayerCopy()
  return alert === undefined ? null : <FormAlert message={fixedCopy(alertLines[alert])} />
}

function CheckDue({
  due,
  handle,
}: {
  readonly due: HoldoutCheckRequest
  readonly handle: HoldoutCheckHandle
}): ReactElement {
  const { fixedCopy } = usePlayerCopy()
  return (
    <div className="flex flex-col gap-4 font-sans">
      <p className="m-0 text-body text-ink">
        <LabelText label={fixedCopy((catalog) => catalog.holdoutCheckDueLine(due))} />
      </p>
      <p className="m-0 text-body text-ink-muted">
        <LabelText label={fixedCopy((catalog) => catalog.holdoutCheckSkipLine())} />
      </p>
      <CheckAlert alert={handle.alert} />
      <Button
        type="button"
        tone="primary"
        availability={availabilityOf('begin', handle.waiting)}
        onClick={handle.begin}
      >
        <LabelText label={fixedCopy((catalog) => catalog.holdoutCheckStart())} />
      </Button>
      <Button
        type="button"
        tone="quiet"
        availability={availabilityOf('skip', handle.waiting)}
        onClick={handle.skip}
      >
        <LabelText label={fixedCopy((catalog) => catalog.holdoutCheckSkip())} />
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
  const { fixedCopy } = usePlayerCopy()
  return (
    <div className="flex flex-col gap-4">
      <ChoiceWalk
        items={asking.check.items}
        lines={{
          heading: fixedCopy((catalog) => catalog.placementBand({ band: asking.check.band })),
          prompt: fixedCopy((catalog) => catalog.placementPrompt()),
          next: fixedCopy((catalog) => catalog.placementNext()),
          choose: fixedCopy((catalog) => catalog.placementChoose()),
          send: fixedCopy((catalog) => catalog.holdoutCheckSend()),
          progressOf: (number, total) =>
            fixedCopy((catalog) => catalog.placementProgress({ number, total })),
        }}
        isSending={handle.waiting === 'answers'}
        onSend={(answers) => handle.send({ answers: [...answers] })}
      />
      <CheckAlert alert={handle.alert} />
    </div>
  )
}

function CheckEnd({ line }: { readonly line: Label }): ReactElement {
  const { chrome } = usePlayerCopy()
  return (
    <div className="flex flex-col items-start gap-4">
      <p role="status" className="m-0 font-sans text-body text-ink">
        <LabelText label={line} />
      </p>
      <TextLink to="/school">
        <LabelText label={chrome((catalog) => catalog.townGoToSchool())} />
      </TextLink>
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
  const { fixedCopy } = usePlayerCopy()
  switch (view.kind) {
    case 'failed':
      return (
        <ReadFailed
          message={fixedCopy((catalog) => catalog.holdoutCheckFailed())}
          retryLabel={fixedCopy((catalog) => catalog.placementRetry())}
          onRetry={handle.reread}
        />
      )
    case 'notOpen':
      return <CheckEnd line={fixedCopy((catalog) => catalog.holdoutCheckRefused())} />
    case 'due':
      return <CheckDue due={view.check} handle={handle} />
    case 'asking':
      return <CheckAsking asking={view} handle={handle} />
    case 'done':
      return <CheckEnd line={fixedCopy((catalog) => catalog.holdoutCheckDone())} />
    case 'skipped':
      return <CheckEnd line={fixedCopy((catalog) => catalog.holdoutCheckSkipped())} />
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
