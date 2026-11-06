import { createLink, type LinkComponent } from '@tanstack/react-router'
import type { ComponentProps, ReactElement } from 'react'

function TextAnchor(props: ComponentProps<'a'>): ReactElement {
  return (
    <a
      {...props}
      className="inline-flex min-h-control items-center font-sans text-button text-action underline underline-offset-2 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus"
    />
  )
}

export const TextLink: LinkComponent<typeof TextAnchor> = createLink(TextAnchor)
