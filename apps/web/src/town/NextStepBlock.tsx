import { townNextTitle } from '@mygame/catalog'
import { type ReactElement, useId } from 'react'
import { Block } from '../design-system/Block'
import { CountdownLine } from '../design-system/CountdownLine'
import type { NextStepCardContent } from './nextStepCardOf'

export interface NextStepBlockProps {
  readonly content: NextStepCardContent
  readonly heading: 'h2' | 'h3'
}

export function NextStepBlock({
  content: { line, detail, countdown },
  heading: Heading,
}: NextStepBlockProps): ReactElement {
  const titleId = useId()
  return (
    <Block hue="peach" labelledBy={titleId}>
      <Heading id={titleId} className="m-0 text-meta text-on-block-muted">
        {townNextTitle()}
      </Heading>
      <p className="m-0 text-display wrap-anywhere">{line}</p>
      {detail !== undefined && <p className="m-0 text-body">{detail}</p>}
      {countdown !== undefined && <CountdownLine {...countdown} ground="block" />}
    </Block>
  )
}
