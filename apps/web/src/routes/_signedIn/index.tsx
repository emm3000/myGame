import { createFileRoute, redirect } from '@tanstack/react-router'
import type { ReactElement } from 'react'
import { copy } from '../../copy'
import { FormAlert } from '../../design-system/FormAlert'

function FirstFiefRefusal(): ReactElement {
  const refusal = Route.useLoaderData()
  return <FormAlert message={copy.refusals[refusal]} />
}

export const Route = createFileRoute('/_signedIn/')({
  loader: async ({ context }) => {
    const fiefs = await context.apiClient.fiefs()
    if (!fiefs.ok) {
      return fiefs.refusal
    }
    const [firstFief] = fiefs.value.fiefs
    if (firstFief === undefined) {
      return 'FiefNotFound'
    }
    throw redirect({ to: '/feudo/$fiefId', params: { fiefId: firstFief.id } })
  },
  component: FirstFiefRefusal,
})
