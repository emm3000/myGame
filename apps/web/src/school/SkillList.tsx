import { schoolSkillName, schoolSkillRate } from '@mygame/catalog'
import type { TownOverview } from '@mygame/contracts/town'
import { skillLevelOf } from '@mygame/domain'
import { type ReactElement, useId } from 'react'
import { resourceAccent } from '../design-system/resourceAccent'
import { townResourceNameOf } from '../resources/townResourceNameOf'

type EarnedSkill = TownOverview['skills'][number]

interface SkillLine {
  readonly key: string
  readonly resource: EarnedSkill['resource']
  readonly name: string
  readonly rate: string
}

const skillLinesOf = (skills: ReadonlyArray<EarnedSkill>): ReadonlyArray<SkillLine> =>
  skills.map(({ lessonId, resource, ratePercent }, index) => {
    const level = skillLevelOf(skills.slice(0, index + 1), resource)
    const resourceName = townResourceNameOf(resource)
    return {
      key: lessonId,
      resource,
      name: schoolSkillName({ resource: resourceName, level }),
      rate: schoolSkillRate({ percent: ratePercent, resource: resourceName }),
    }
  })

function SkillItem({ line }: { readonly line: SkillLine }): ReactElement {
  const Icon = resourceAccent[line.resource]
  return (
    <li aria-label={line.name} className="flex items-center gap-3">
      <span className="flex text-ink">
        <Icon sizeClass="size-icon" />
      </span>
      <span className="flex flex-wrap items-baseline gap-x-3">
        <span className="font-sans text-body text-ink">{line.name}</span>
        <span className="font-sans text-caption text-ink-muted tabular-nums">{line.rate}</span>
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
  readonly title: string
  readonly empty: string
}): ReactElement {
  const titleId = useId()
  return (
    <section
      aria-labelledby={titleId}
      className="flex flex-col gap-3 rounded-md border border-line bg-surface-raised p-5"
    >
      <h3 id={titleId} className="m-0 font-sans text-heading text-ink">
        {title}
      </h3>
      {skills.length === 0 ? (
        <p className="m-0 font-sans text-body text-ink-muted">{empty}</p>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-3 p-0">
          {skillLinesOf(skills).map((line) => (
            <SkillItem key={line.key} line={line} />
          ))}
        </ul>
      )}
    </section>
  )
}
