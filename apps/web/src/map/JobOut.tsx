import type { ReactElement, Ref } from 'react'
import { CardAction } from '../design-system/CardAction'
import { CountdownLine } from '../design-system/CountdownLine'
import { FormAlert } from '../design-system/FormAlert'
import { focusTargetClass } from '../design-system/focusTargetClass'
import { refusalLineOf } from '../refusals/refusalLineOf'
import type { JobOutContent } from './jobOutOf'
import type { TownJob } from './useJob'

export interface JobOutProps {
  readonly content: JobOutContent
  readonly job: TownJob
  readonly titleRef: Ref<HTMLHeadingElement>
}

export function JobOut({ content, job, titleRef }: JobOutProps): ReactElement {
  const { callBack } = content
  const refused = job.callBackRefused
  return (
    <section
      aria-label={content.title}
      className="flex flex-col gap-3 rounded-md border border-line bg-surface-raised p-4"
    >
      <div>
        <h2
          ref={titleRef}
          tabIndex={-1}
          className={`m-0 self-start rounded-sm font-sans text-heading text-ink ${focusTargetClass}`}
        >
          {content.title}
        </h2>
        <p className="m-0 font-sans text-caption text-ink-muted">{content.siteLine}</p>
        <p className="m-0 font-sans text-caption text-ink-muted">{content.teamLine}</p>
        {content.wasteLine !== undefined && (
          <p className="m-0 font-sans text-caption text-ink-muted">{content.wasteLine}</p>
        )}
      </div>
      <CountdownLine words={content.countdown.words} time={content.countdown.time} />
      {content.pay !== undefined && (
        <p className="m-0 font-sans text-caption text-ink-muted">{content.pay}</p>
      )}
      {callBack !== undefined && (
        <CardAction
          type="button"
          label={callBack.label}
          state={{ kind: 'affordable' }}
          isWaiting={job.isCallingBack}
          tone="quiet"
          onAction={() => job.callBack(callBack.target)}
        />
      )}
      {refused !== undefined && (
        <FormAlert message={refusalLineOf(refused.refusal, refused.error)} />
      )}
    </section>
  )
}
