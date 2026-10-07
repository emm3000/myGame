import { FiefRequestSchema } from '@mygame/contracts'
import { createFileRoute, Outlet, useMatchRoute } from '@tanstack/react-router'
import type { ReactElement } from 'react'
import { copy } from '../../copy'
import { FormAlert } from '../../design-system/FormAlert'
import { FiefStatus } from '../../fief/FiefStatus'
import { LiveFiefContext } from '../../fief/LiveFiefContext'
import type { LiveFief } from '../../fief/liveFief'
import { useLiveFief } from '../../fief/useLiveFief'
import { barHintOf } from '../../hints/barHintOf'
import { hintPropsOf } from '../../hints/hintPropsOf'
import { useLayoutHints } from '../../hints/useLayoutHints'

function LiveFiefStatus({ fief }: { readonly fief: LiveFief }): ReactElement {
  const hints = useLayoutHints()
  const matchRoute = useMatchRoute()
  const isFiefScreen = matchRoute({ to: '/feudo/$fiefId' }) !== false
  const hint = isFiefScreen ? barHintOf(fief, hints.hidden) : undefined
  return <FiefStatus fief={fief} hint={hint === undefined ? undefined : hintPropsOf(hint, hints)} />
}

function LiveFiefLayout({ fiefId }: { readonly fiefId: string }): ReactElement {
  const { apiClient } = Route.useRouteContext()
  const live = useLiveFief(apiClient, fiefId)
  return (
    <LiveFiefContext value={live}>
      <div className="flex flex-col gap-6">
        {live.state.kind === 'live' && <LiveFiefStatus fief={live.state.fief} />}
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
