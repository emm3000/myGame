import { createRootRoute, HeadContent, Scripts } from '@tanstack/react-router'
import type { ReactElement, ReactNode } from 'react'
import { copy } from '../copy'
import { paletteStyleSheet } from '../design/tokens'

function RootDocument({ children }: { readonly children: ReactNode }): ReactElement {
  return (
    <html lang="es">
      <head>
        <HeadContent />
        <style>{paletteStyleSheet()}</style>
      </head>
      <body style={{ margin: 0 }}>
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
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Alegreya:wght@400;700&family=Alegreya+Sans:wght@600;700&family=Cormorant+Garamond:wght@600&display=swap',
      },
    ],
  }),
  shellComponent: RootDocument,
})
