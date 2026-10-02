import { createLink, type LinkComponent } from '@tanstack/react-router'
import type { ComponentProps, ReactElement } from 'react'

function TextAnchor(props: ComponentProps<'a'>): ReactElement {
  return (
    <a
      {...props}
      className="font-utility text-button text-umber underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-line-strong"
    />
  )
}

export const TextLink: LinkComponent<typeof TextAnchor> = createLink(TextAnchor)
