import { createFileRoute, redirect } from '@tanstack/react-router'
import type { ReactElement } from 'react'
import { FormAlert } from '../../design-system/FormAlert'
import { refusalLineOf } from '../../refusals/refusalLineOf'

function FirstFiefRefusal(): ReactElement {
  const refusal = Route.useLoaderData()
  return <FormAlert message={refusalLineOf(refusal)} />
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
