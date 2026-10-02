import { createFileRoute } from '@tanstack/react-router'
import type { ReactElement } from 'react'
import { copy } from '../../../copy'
import { FormAlert } from '../../../design-system/FormAlert'
import { FiefScreen } from '../../../fief/FiefScreen'
import { useCancel } from '../../../fief/useCancel'
import { useLiveFief } from '../../../fief/useLiveFief'
import { useRecall } from '../../../fief/useRecall'
import { useRecruit } from '../../../fief/useRecruit'
import { useStudy } from '../../../fief/useStudy'
import { useUpgrade } from '../../../fief/useUpgrade'

function FiefOverviewPage(): ReactElement {
  const { apiClient } = Route.useRouteContext()
  const { fiefId } = Route.useParams()
  const { state, adopt } = useLiveFief(apiClient, fiefId)
  const readAt = state.kind === 'live' ? state.fief.overview.readAt : undefined
  const upgrade = useUpgrade(apiClient, fiefId, adopt, readAt)
  const cancel = useCancel(apiClient, fiefId, adopt, readAt)
  const study = useStudy(apiClient, fiefId, adopt, readAt)
  const recruit = useRecruit(apiClient, fiefId, adopt, readAt)
  const recall = useRecall(apiClient, fiefId, adopt, readAt)
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
