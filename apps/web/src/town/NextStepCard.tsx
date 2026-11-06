import { townNextTitle } from '@mygame/catalog'
import { type ReactElement, useId } from 'react'
import { Block } from '../design-system/Block'
import { hueClassOf } from '../design-system/blockClassOf'
import { CountdownLine } from '../design-system/CountdownLine'
import type { LiveTown } from './liveTown'
import { NextStepLink } from './NextStepLink'
import { nextStepCardOf } from './nextStepCardOf'

const stackedBlockClass = 'absolute inset-0 -z-10 rounded-lg'

export function NextStepCard({ town }: { readonly town: LiveTown }): ReactElement {
  const titleId = useId()
  const { line, detail, countdown, action } = nextStepCardOf(town)
  return (
    <div className="flex flex-col gap-5">
      <div className="relative isolate">
        <div aria-hidden="true" className={`${stackedBlockClass} rotate-2 ${hueClassOf('mint')}`} />
        <div
          aria-hidden="true"
          className={`${stackedBlockClass} -rotate-2 ${hueClassOf('lavender')}`}
        />
        <Block hue="peach" labelledBy={titleId}>
          <h3 id={titleId} className="m-0 text-meta text-on-block-muted">
            {townNextTitle()}
          </h3>
          <p className="m-0 text-display wrap-anywhere">{line}</p>
          {detail !== undefined && <p className="m-0 text-body">{detail}</p>}
          {countdown !== undefined && <CountdownLine {...countdown} ground="block" />}
        </Block>
      </div>
      <NextStepLink action={action} tone="primary" />
    </div>
  )
}
