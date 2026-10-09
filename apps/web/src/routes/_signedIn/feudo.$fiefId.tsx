import type { FiefOverview } from '@mygame/contracts'
import { FiefRequestSchema } from '@mygame/contracts'
import { createFileRoute, Outlet, useMatchRoute } from '@tanstack/react-router'
import type { ReactElement } from 'react'
import { copy } from '../../copy'
import { FormAlert } from '../../design-system/FormAlert'
import { LiveRegion } from '../../design-system/LiveRegion'
import { FiefNameContext } from '../../fief/FiefNameContext'
import { FiefStatus } from '../../fief/FiefStatus'
import { LiveFiefContext } from '../../fief/LiveFiefContext'
import type { LiveFief } from '../../fief/liveFief'
import { useFiefNameTarget } from '../../fief/useFiefNameTarget'
import { useLiveFief } from '../../fief/useLiveFief'
import { useStatusBlockMargin } from '../../fief/useStatusBlockMargin'
import { useFocusTarget } from '../../focus/useFocusTarget'
import { barHintOf } from '../../hints/barHintOf'
import { hintFocusingAfterDismiss } from '../../hints/hintFocusingAfterDismiss'
import { hintPropsOf } from '../../hints/hintPropsOf'
import { useLayoutHints } from '../../hints/useLayoutHints'
import { useFinishAnnouncement } from '../../notices/useFinishAnnouncement'
import { type FinishNoticesHandle, useFinishNotices } from '../../notices/useFinishNotices'

function LiveFiefStatus({
  fief,
  notices,
  blockRef,
}: {
  readonly fief: LiveFief
  readonly notices: FinishNoticesHandle
  readonly blockRef: (block: HTMLElement | null) => void
}): ReactElement {
  const hints = useLayoutHints()
  const fiefName = useFiefNameTarget()
  const matchRoute = useMatchRoute()
  const isFiefScreen = matchRoute({ to: '/feudo/$fiefId' }) !== false
  const hint = isFiefScreen ? barHintOf(fief, hints.hidden) : undefined
  return (
    <FiefStatus
      fief={fief}
      hint={
        hint === undefined
          ? undefined
          : hintFocusingAfterDismiss(hintPropsOf(hint, hints), fiefName.focus)
      }
      notices={notices}
      blockRef={blockRef}
    />
  )
}

function LiveFiefLayout({ fiefId }: { readonly fiefId: string }): ReactElement {
  const { apiClient } = Route.useRouteContext()
  const notices = useFinishNotices()
  const announcement = useFinishAnnouncement()
  const live = useLiveFief(apiClient, fiefId, (previous: FiefOverview, next: FiefOverview) => {
    notices.notifyBetween(previous, next)
    announcement.announceBetween(previous, next)
  })
  const fiefName = useFocusTarget<HTMLHeadingElement>()
  const statusBlockRef = useStatusBlockMargin()
  return (
    <LiveFiefContext value={live}>
      <FiefNameContext value={fiefName}>
        <div className="flex flex-col gap-6">
          <LiveRegion {...announcement.announcement} />
          {live.state.kind === 'live' && (
            <LiveFiefStatus fief={live.state.fief} notices={notices} blockRef={statusBlockRef} />
          )}
          <Outlet />
        </div>
      </FiefNameContext>
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
