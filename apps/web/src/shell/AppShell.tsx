import type { CSSProperties, ReactElement } from 'react'
import { copy } from '../copy'
import { color, typeFamilies } from '../design/tokens'

const shellStyle: CSSProperties = {
  minHeight: '100vh',
  margin: 0,
  backgroundColor: color('surface'),
  color: color('ink'),
}

const headerStyle: CSSProperties = {
  padding: '16px clamp(16px, 4vw, 32px)',
  backgroundColor: color('surface-raised'),
  borderBottom: `1px solid ${color('line')}`,
}

const titleStyle: CSSProperties = {
  margin: 0,
  fontFamily: typeFamilies.display,
  fontSize: '40px',
  lineHeight: '44px',
  fontWeight: 600,
  color: color('umber'),
}

const mainStyle: CSSProperties = {
  padding: '24px clamp(16px, 4vw, 32px)',
  fontFamily: typeFamilies.body,
  fontSize: '16px',
  lineHeight: '24px',
  color: color('ink-muted'),
}

export function AppShell(): ReactElement {
  return (
    <div style={shellStyle}>
      <header style={headerStyle}>
        <h1 style={titleStyle}>{copy.shell.title}</h1>
      </header>
      <main style={mainStyle}>
        <p>{copy.shell.welcome}</p>
      </main>
    </div>
  )
}
