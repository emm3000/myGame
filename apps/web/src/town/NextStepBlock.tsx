import { type ReactElement, type ReactNode, type Ref, useId } from 'react'
import { usePlayerCopy } from '../copy/usePlayerCopy'
import { Block } from '../design-system/Block'
import { CountdownLine } from '../design-system/CountdownLine'
import { blockFocusTargetClass } from '../design-system/focusTargetClass'
import { LabelText } from '../design-system/LabelText'
import type { NextStepCardContent } from './nextStepCardOf'

export interface NextStepBlockProps {
  readonly content: NextStepCardContent
  readonly heading: 'h2' | 'h3'
  readonly headingRef?: Ref<HTMLHeadingElement> | undefined
  readonly children?: ReactNode
}

export function NextStepBlock({
  content: { line, detail, countdown },
  heading: Heading,
  headingRef,
  children,
}: NextStepBlockProps): ReactElement {
  const titleId = useId()
  const copy = usePlayerCopy()
  return (
    <Block hue="peach" labelledBy={titleId}>
      <Heading
        id={titleId}
        ref={headingRef}
        tabIndex={headingRef === undefined ? undefined : -1}
        className={`m-0 text-meta text-on-block-muted ${blockFocusTargetClass}`}
      >
        <LabelText label={copy.chrome((catalog) => catalog.townNextTitle())} />
      </Heading>
      <p className="m-0 text-display wrap-anywhere">
        <LabelText label={line} />
      </p>
      {detail !== undefined && (
        <p className="m-0 text-body">
          <LabelText label={detail} />
        </p>
      )}
      {children}
      {countdown !== undefined && <CountdownLine {...countdown} ground="block" />}
    </Block>
  )
}
