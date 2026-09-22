import { createFileRoute } from '@tanstack/react-router'
import type { ReactElement } from 'react'
import { copy } from '../../copy'

function FiefPlaceholder(): ReactElement {
  return <p className="m-0">{copy.shell.welcome}</p>
}

export const Route = createFileRoute('/_signedIn/')({
  component: FiefPlaceholder,
})
