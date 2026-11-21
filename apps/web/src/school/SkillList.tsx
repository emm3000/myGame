import type { TownOverview } from '@mygame/contracts'
import { skillLevelOf } from '@mygame/domain'
import { type ReactElement, useId } from 'react'
import type { PlayerCopy } from '../copy/PlayerCopy'
import { usePlayerCopy } from '../copy/usePlayerCopy'
import type { Label } from '../design-system/Label'
import { LabelText } from '../design-system/LabelText'
import { resourceAccent } from '../design-system/resourceAccent'
import { spokenLineOf } from '../design-system/spokenLineOf'
import { townResourceNameOf } from '../resources/townResourceNameOf'

type EarnedSkill = TownOverview['skills'][number]

interface SkillLine {
  readonly key: string
  readonly resource: EarnedSkill['resource']
  readonly name: Label
  readonly rate: Label
}

const skillLinesOf = (
  skills: ReadonlyArray<EarnedSkill>,
  { chrome }: PlayerCopy,
): ReadonlyArray<SkillLine> =>
  skills.map(({ lessonId, resource, ratePercent }, index) => {
    const level = skillLevelOf(skills.slice(0, index + 1), resource)
    return {
      key: lessonId,
      resource,
      name: chrome((catalog) =>
        catalog.schoolSkillName({ resource: townResourceNameOf(catalog, resource), level }),
      ),
      rate: chrome((catalog) =>
        catalog.schoolSkillRate({
          percent: ratePercent,
          resource: townResourceNameOf(catalog, resource),
        }),
      ),
    }
  })

function SkillItem({ line }: { readonly line: SkillLine }): ReactElement {
  const Icon = resourceAccent[line.resource]
  return (
    <li aria-label={spokenLineOf(line.name)} className="flex items-center gap-3">
      <span className="flex text-ink">
        <Icon sizeClass="size-icon" />
      </span>
      <span className="flex flex-wrap items-baseline gap-x-3">
        <span className="font-sans text-body text-ink">
          <LabelText label={line.name} />
        </span>
        <span className="font-sans text-caption text-ink-muted tabular-nums">
          <LabelText label={line.rate} />
        </span>
      </span>
    </li>
  )
}

export function SkillList({
  skills,
  title,
  empty,
}: {
  readonly skills: ReadonlyArray<EarnedSkill>
  readonly title: Label
  readonly empty: Label
}): ReactElement {
  const titleId = useId()
  const copy = usePlayerCopy()
  return (
    <section
      aria-labelledby={titleId}
      className="flex flex-col gap-3 rounded-md border border-line bg-surface-raised p-5"
    >
      <h2 id={titleId} className="m-0 font-sans text-heading text-ink">
        <LabelText label={title} />
      </h2>
      {skills.length === 0 ? (
        <p className="m-0 font-sans text-body text-ink-muted">
          <LabelText label={empty} />
        </p>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-3 p-0">
          {skillLinesOf(skills, copy).map((line) => (
            <SkillItem key={line.key} line={line} />
          ))}
        </ul>
      )}
    </section>
  )
}
