import { en } from '@mygame/catalog'
import { createRootRouteWithContext, HeadContent, Scripts } from '@tanstack/react-router'
import { type ReactElement, type ReactNode, useState } from 'react'
import type { ApiClient } from '../api/apiClient'
import { DocumentLanguageContext } from '../copy/DocumentLanguageContext'
import type { LineLanguage } from '../design-system/Label'
import stylesheet from '../styles.css?url'

function RootDocument({ children }: { readonly children: ReactNode }): ReactElement {
  const [language, setLanguage] = useState<LineLanguage>('en')
  return (
    <html lang={language} className="scroll-pb-12">
      <head>
        <HeadContent />
      </head>
      <body>
        <DocumentLanguageContext value={setLanguage}>{children}</DocumentLanguageContext>
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
      { title: en.shellTitle() },
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
