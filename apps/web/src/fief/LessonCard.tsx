import { lessonTitle, lessonToReview } from '@mygame/catalog'
import type { ReactElement } from 'react'
import { ButtonLink } from '../design-system/ButtonLink'
import { Panel } from '../design-system/Panel'

export function LessonCard(): ReactElement {
  return (
    <Panel element="article" toneClass="border-line bg-surface-raised" spacingClass="gap-3 p-5">
      <h4 className="m-0 font-sans text-title text-ink">{lessonTitle()}</h4>
      <ButtonLink to="/reviews" tone="quiet">
        {lessonToReview()}
      </ButtonLink>
    </Panel>
  )
}
