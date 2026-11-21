import type { Placement } from '@mygame/contracts'
import { type ReactElement, type ReactNode, type RefCallback, useId } from 'react'
import { usePlayerCopy } from '../copy/usePlayerCopy'
import { Button, type ButtonAvailability } from '../design-system/Button'
import { focusTargetClass } from '../design-system/focusTargetClass'
import { LabelText } from '../design-system/LabelText'
import { ReadFailed } from '../design-system/ReadFailed'
import { type StepFocus, useStepFocus } from '../focus/useStepFocus'
import { BandScores } from './BandScores'
import { PlacementAsking } from './PlacementAsking'
import type { PlacementAction, PlacementHandle, PlacementView } from './usePlacement'

type ClosedPlacement = Extract<Placement, { readonly kind: 'closed' }>

export function PlacementTitled({ children }: { readonly children: ReactNode }): ReactElement {
  const titleId = useId()
  const { fixedCopy } = usePlayerCopy()
  return (
    <section aria-labelledby={titleId} className="flex max-w-form flex-col gap-6">
      <h1 id={titleId} className="m-0 font-sans text-display text-ink">
        <LabelText label={fixedCopy((catalog) => catalog.placementTitle())} />
      </h1>
      {children}
    </section>
  )
}

const availabilityOf = (
  action: PlacementAction,
  waiting: PlacementAction | undefined,
): ButtonAvailability => {
  if (waiting === undefined) {
    return 'available'
  }
  return waiting === action ? 'waiting' : 'blocked'
}

function PlacementOffered({ placement }: { readonly placement: PlacementHandle }): ReactElement {
  const { fixedCopy } = usePlayerCopy()
  return (
    <div className="flex flex-col gap-4 font-sans">
      <p className="m-0 text-body text-ink">
        <LabelText label={fixedCopy((catalog) => catalog.placementOfferedLine())} />
      </p>
      <p className="m-0 text-body text-ink-muted">
        <LabelText label={fixedCopy((catalog) => catalog.placementOfferedSkipLine())} />
      </p>
      <Button
        type="button"
        tone="primary"
        availability={availabilityOf('begin', placement.waiting)}
        onClick={placement.begin}
      >
        <LabelText label={fixedCopy((catalog) => catalog.placementStart())} />
      </Button>
      <Button
        type="button"
        tone="quiet"
        availability={availabilityOf('skip', placement.waiting)}
        onClick={placement.skip}
      >
        <LabelText label={fixedCopy((catalog) => catalog.placementSkip())} />
      </Button>
    </div>
  )
}

function PlacementResult({
  closed,
  titleRef,
}: {
  readonly closed: ClosedPlacement
  readonly titleRef: RefCallback<HTMLElement>
}): ReactElement {
  const { fixedCopy } = usePlayerCopy()
  if (closed.scores.length === 0) {
    return (
      <p
        ref={titleRef}
        tabIndex={-1}
        className={`m-0 font-sans text-body text-ink ${focusTargetClass}`}
      >
        <LabelText label={fixedCopy((catalog) => catalog.placementClosedNone())} />
      </p>
    )
  }
  return (
    <div className="flex flex-col gap-4">
      <h2
        ref={titleRef}
        tabIndex={-1}
        className={`m-0 font-sans text-heading text-ink ${focusTargetClass}`}
      >
        <LabelText label={fixedCopy((catalog) => catalog.placementResultTitle())} />
      </h2>
      <BandScores scores={closed.scores} />
    </div>
  )
}

function PlacementRead({
  shown,
  placement,
  step,
}: {
  readonly shown: Placement
  readonly placement: PlacementHandle
  readonly step: StepFocus
}): ReactElement {
  switch (shown.kind) {
    case 'offered':
      return <PlacementOffered placement={placement} />
    case 'asking':
      return (
        <PlacementAsking
          key={shown.band}
          asking={shown}
          word={step}
          isSending={placement.waiting === 'answers'}
          onSend={placement.send}
        />
      )
    case 'closed':
      return <PlacementResult closed={shown} titleRef={step.ref} />
    default: {
      const unreachable: never = shown
      return unreachable
    }
  }
}

const stepOf = (view: PlacementView): string | undefined => {
  switch (view.kind) {
    case 'loading':
      return undefined
    case 'failed':
      return view.kind
    case 'read':
      return view.placement.kind === 'asking'
        ? `asking-${view.placement.band}`
        : view.placement.kind
    default: {
      const unreachable: never = view
      return unreachable
    }
  }
}

export function PlacementScreen({
  placement,
}: {
  readonly placement: PlacementHandle
}): ReactElement | null {
  const { view } = placement
  const { fixedCopy } = usePlayerCopy()
  const step = useStepFocus(stepOf(view))
  switch (view.kind) {
    case 'loading':
      return null
    case 'failed':
      return (
        <PlacementTitled>
          <ReadFailed
            message={fixedCopy((catalog) => catalog.placementFailed())}
            retryLabel={fixedCopy((catalog) => catalog.placementRetry())}
            onRetry={placement.reread}
          />
        </PlacementTitled>
      )
    case 'read':
      return (
        <PlacementTitled>
          <PlacementRead shown={view.placement} placement={placement} step={step} />
        </PlacementTitled>
      )
    default: {
      const unreachable: never = view
      return unreachable
    }
  }
}
