import type { ReactElement, Ref } from 'react'
import { focusTargetClass } from '../design-system/focusTargetClass'
import { SeasonMark, type SeasonMarkProps } from '../design-system/SeasonMark'

export interface SeasonSectionHeadingProps {
  readonly id: string
  readonly title: string
  readonly mark: SeasonMarkProps | undefined
  readonly headingRef?: Ref<HTMLHeadingElement> | undefined
}

export function SeasonSectionHeading({
  id,
  title,
  mark,
  headingRef,
}: SeasonSectionHeadingProps): ReactElement {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <h3
        ref={headingRef}
        id={id}
        tabIndex={-1}
        className={`m-0 rounded-sm font-body text-heading text-ink ${focusTargetClass}`}
      >
        {title}
      </h3>
      {mark !== undefined && (
        <span className="flex">
          <SeasonMark {...mark} />
        </span>
      )}
    </div>
  )
}
