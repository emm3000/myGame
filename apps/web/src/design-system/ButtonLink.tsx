import { createLink, type LinkComponent } from '@tanstack/react-router'
import type { ComponentProps, ReactElement } from 'react'
import { type ActionTone, buttonClassOf } from './Button'

type ButtonAnchorProps = Omit<ComponentProps<'a'>, 'className'> & { readonly tone: ActionTone }

function ButtonAnchor({ tone, ...props }: ButtonAnchorProps): ReactElement {
  return (
    <a
      {...props}
      data-tone={tone}
      className={`inline-flex items-center justify-center no-underline ${buttonClassOf(tone)}`}
    />
  )
}

export const ButtonLink: LinkComponent<typeof ButtonAnchor> = createLink(ButtonAnchor)
