import { createFileRoute } from '@tanstack/react-router'
import type { ReactElement } from 'react'
import { copy } from '../../../copy'
import type { DigestCardProps } from '../../../design-system/DigestCard'
import { FormAlert } from '../../../design-system/FormAlert'
import { digestFiefsOf } from '../../../fief/digestFiefsOf'
import { FiefScreen } from '../../../fief/FiefScreen'
import { goalCardOf } from '../../../fief/goalCardOf'
import { useCancel } from '../../../fief/useCancel'
import { type DigestHandle, useDigest } from '../../../fief/useDigest'
import { useGuidanceDismissal } from '../../../fief/useGuidanceDismissal'
import { useLayoutFief } from '../../../fief/useLayoutFief'
import { useRecall } from '../../../fief/useRecall'
import { useRecruit } from '../../../fief/useRecruit'
import { useStudy } from '../../../fief/useStudy'
import { useUpgrade } from '../../../fief/useUpgrade'

function digestCardOf(digest: DigestHandle): DigestCardProps | undefined {
  const { state } = digest
  if (state.kind === 'silent') {
    return undefined
  }
  return {
    title: copy.digest.title,
    fiefs: digestFiefsOf(state.digest, state.readAt),
    acknowledgeLabel: copy.digest.acknowledge,
    isWaiting: digest.isWaiting,
    refusal: digest.refusal === undefined ? undefined : copy.refusals[digest.refusal],
    onAcknowledge: digest.acknowledge,
  }
}

function FiefOverviewPage(): ReactElement {
  const { apiClient } = Route.useRouteContext()
  const { fiefId } = Route.useParams()
  const { state, adopt } = useLayoutFief()
  const readAt = state.kind === 'live' ? state.fief.overview.readAt : undefined
  const upgrade = useUpgrade(apiClient, fiefId, adopt, readAt)
  const cancel = useCancel(apiClient, fiefId, adopt, readAt)
  const study = useStudy(apiClient, fiefId, adopt, readAt)
  const recruit = useRecruit(apiClient, fiefId, adopt, readAt)
  const recall = useRecall(apiClient, fiefId, adopt, readAt)
  const digest = useDigest(apiClient)
  const dismissal = useGuidanceDismissal(apiClient, fiefId)
  switch (state.kind) {
    case 'loading':
      return <p className="m-0">{copy.fief.loading}</p>
    case 'refused':
      return <FormAlert message={copy.refusals[state.refusal]} />
    case 'live':
      return (
        <FiefScreen
          fief={state.fief}
          upgrade={upgrade}
          cancel={cancel}
          study={study}
          recruit={recruit}
          recall={recall}
          digest={digestCardOf(digest)}
          goal={goalCardOf(state.fief.overview, dismissal)}
        />
      )
    default: {
      const unreachable: never = state
      return unreachable
    }
  }
}

export const Route = createFileRoute('/_signedIn/feudo/$fiefId/')({
  component: FiefOverviewPage,
})
