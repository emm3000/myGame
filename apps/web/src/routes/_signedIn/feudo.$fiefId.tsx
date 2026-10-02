import { FiefRequestSchema } from '@mygame/contracts'
import { createFileRoute, Outlet } from '@tanstack/react-router'
import type { ReactElement } from 'react'
import { copy } from '../../copy'
import { FormAlert } from '../../design-system/FormAlert'

function NamedFiefLayout(): ReactElement {
  const request = FiefRequestSchema.safeParse(Route.useParams())
  return request.success ? <Outlet /> : <FormAlert message={copy.refusals.FiefNotFound} />
}

export const Route = createFileRoute('/_signedIn/feudo/$fiefId')({
  component: NamedFiefLayout,
})
