import { Link, type LinkProps } from '@tanstack/react-router'
import type { ReactElement } from 'react'
import { type ButtonTone, buttonClassOf } from './Button'

export interface ButtonLinkProps {
  readonly to: NonNullable<LinkProps['to']>
  readonly tone: ButtonTone
  readonly children: string
}

export function ButtonLink({ to, tone, children }: ButtonLinkProps): ReactElement {
  return (
    <Link to={to} className={`inline-flex items-center no-underline ${buttonClassOf(tone)}`}>
      {children}
    </Link>
  )
}
