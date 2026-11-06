import type { ReactElement } from 'react'

export interface CardHeaderProps {
  readonly name: string
  readonly levelLabel: string
  readonly titleElement: 'h3' | 'h4'
  readonly isAtMaxLevel: boolean
}

export function CardHeader({
  name,
  levelLabel,
  titleElement: Title,
  isAtMaxLevel,
}: CardHeaderProps): ReactElement {
  return (
    <header className="flex items-baseline justify-between gap-2">
      <Title className={`m-0 font-sans text-title ${isAtMaxLevel ? 'text-ink-muted' : 'text-ink'}`}>
        {name}
      </Title>
      <span className="whitespace-nowrap rounded-pill bg-surface-sunken px-2 font-sans text-label text-ink tabular-nums">
        {levelLabel}
      </span>
    </header>
  )
}
