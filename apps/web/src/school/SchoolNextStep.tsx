import type { ReactElement } from 'react'
import type { LiveTown } from '../town/liveTown'
import { NextStepBlock } from '../town/NextStepBlock'
import { NextStepLink } from '../town/NextStepLink'
import { nextStepCardOf } from '../town/nextStepCardOf'

export function SchoolNextStep({ town }: { readonly town: LiveTown }): ReactElement {
  const content = nextStepCardOf(town)
  return (
    <div className="flex flex-col gap-5">
      <NextStepBlock content={content} heading="h2" />
      <NextStepLink action={content.action} tone="primary" />
    </div>
  )
}
