import { shellTitle } from '@mygame/catalog'
import { createRootRouteWithContext, HeadContent, Scripts } from '@tanstack/react-router'
import type { ReactElement, ReactNode } from 'react'
import type { ApiClient } from '../api/apiClient'
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

export interface RouterContext {
  readonly apiClient: ApiClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: shellTitle() },
    ],
    links: [
      { rel: 'stylesheet', href: stylesheet },
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Schibsted+Grotesk:wght@400..800&display=swap',
      },
    ],
  }),
  shellComponent: RootDocument,
})
