import type { ReactElement } from 'react'
import { hueClassOf } from '../design-system/blockClassOf'
import type { LiveTown } from './liveTown'
import { NextStepBlock } from './NextStepBlock'
import { NextStepLink } from './NextStepLink'
import { nextStepCardOf } from './nextStepCardOf'

const stackedBlockClass = 'absolute inset-0 -z-10 rounded-lg'

export function NextStepCard({ town }: { readonly town: LiveTown }): ReactElement {
  const content = nextStepCardOf(town)
  return (
    <div className="flex flex-col gap-5">
      <div className="relative isolate">
        <div aria-hidden="true" className={`${stackedBlockClass} rotate-2 ${hueClassOf('mint')}`} />
        <div
          aria-hidden="true"
          className={`${stackedBlockClass} -rotate-2 ${hueClassOf('lavender')}`}
        />
        <NextStepBlock content={content} heading="h3" />
      </div>
      <NextStepLink action={content.action} tone="primary" />
    </div>
  )
}
