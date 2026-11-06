import { townNextTitle } from '@mygame/catalog'
import { type ReactElement, useId } from 'react'
import { Block } from '../design-system/Block'
import { CountdownLine } from '../design-system/CountdownLine'
import type { LiveTown } from '../town/liveTown'
import { NextStepLink } from '../town/NextStepLink'
import { nextStepCardOf } from '../town/nextStepCardOf'

export function SchoolNextStep({ town }: { readonly town: LiveTown }): ReactElement {
  const titleId = useId()
  const { line, detail, countdown, action } = nextStepCardOf(town)
  return (
    <div className="flex flex-col gap-5">
      <Block hue="peach" labelledBy={titleId}>
        <h2 id={titleId} className="m-0 text-meta text-on-block-muted">
          {townNextTitle()}
        </h2>
        <p className="m-0 text-display wrap-anywhere">{line}</p>
        {detail !== undefined && <p className="m-0 text-body">{detail}</p>}
        {countdown !== undefined && <CountdownLine {...countdown} ground="block" />}
      </Block>
      <NextStepLink action={action} tone="primary" />
    </div>
  )
}
