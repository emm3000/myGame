import { Link, type LinkProps } from '@tanstack/react-router'
import type { ReactElement } from 'react'

export interface TextLinkProps {
  readonly to: NonNullable<LinkProps['to']>
  readonly params?: LinkProps['params']
  readonly children: string
}

export function TextLink({ to, params, children }: TextLinkProps): ReactElement {
  return (
    <Link
      to={to}
      {...(params === undefined ? {} : { params })}
      className="font-utility text-button text-umber underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-line-strong"
    >
      {children}
    </Link>
  )
}
