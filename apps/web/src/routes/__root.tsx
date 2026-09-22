import { createRootRoute, HeadContent, Scripts } from '@tanstack/react-router'
import type { ReactElement, ReactNode } from 'react'
import { copy } from '../copy'
import stylesheet from '../styles.css?url'

function RootDocument({ children }: { readonly children: ReactNode }): ReactElement {
  return (
    <html lang="es">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  )
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: copy.shell.title },
    ],
    links: [
      { rel: 'stylesheet', href: stylesheet },
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Alegreya:wght@400;700&family=Alegreya+Sans:wght@600;700&family=Cormorant+Garamond:wght@600&display=swap',
      },
    ],
  }),
  shellComponent: RootDocument,
})
