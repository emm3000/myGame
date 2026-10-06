import { FiefRequestSchema } from '@mygame/contracts'
import { createFileRoute, Outlet } from '@tanstack/react-router'
import type { ReactElement } from 'react'
import { copy } from '../../copy'
import { FormAlert } from '../../design-system/FormAlert'
import { FiefStatus } from '../../fief/FiefStatus'
import { LiveFiefContext } from '../../fief/LiveFiefContext'
import { useLiveFief } from '../../fief/useLiveFief'

function LiveFiefLayout({ fiefId }: { readonly fiefId: string }): ReactElement {
  const { apiClient } = Route.useRouteContext()
  const live = useLiveFief(apiClient, fiefId)
  return (
    <LiveFiefContext value={live}>
      <div className="flex flex-col gap-6">
        {live.state.kind === 'live' && <FiefStatus fief={live.state.fief} />}
        <Outlet />
      </div>
    </LiveFiefContext>
  )
}

function NamedFiefLayout(): ReactElement {
  const request = FiefRequestSchema.safeParse(Route.useParams())
  return request.success ? (
    <LiveFiefLayout key={request.data.fiefId} fiefId={request.data.fiefId} />
  ) : (
    <FormAlert message={copy.refusals.FiefNotFound} />
  )
}

export const Route = createFileRoute('/_signedIn/feudo/$fiefId')({
  component: NamedFiefLayout,
})
