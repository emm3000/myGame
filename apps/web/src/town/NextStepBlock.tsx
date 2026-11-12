import { townNextTitle } from '@mygame/catalog'
import { type ReactElement, type ReactNode, type Ref, useId } from 'react'
import { Block } from '../design-system/Block'
import { CountdownLine } from '../design-system/CountdownLine'
import { blockFocusTargetClass } from '../design-system/focusTargetClass'
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
  return (
    <Block hue="peach" labelledBy={titleId}>
      <Heading
        id={titleId}
        ref={headingRef}
        tabIndex={headingRef === undefined ? undefined : -1}
        className={`m-0 text-meta text-on-block-muted ${blockFocusTargetClass}`}
      >
        {townNextTitle()}
      </Heading>
      <p className="m-0 text-display wrap-anywhere">{line}</p>
      {detail !== undefined && <p className="m-0 text-body">{detail}</p>}
      {children}
      {countdown !== undefined && <CountdownLine {...countdown} ground="block" />}
    </Block>
  )
}
