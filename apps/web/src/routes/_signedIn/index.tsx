import { createFileRoute } from '@tanstack/react-router'
import type { ReactElement } from 'react'
import { copy } from '../../copy'
import { FormAlert } from '../../design-system/FormAlert'
import { FiefScreen } from '../../fief/FiefScreen'
import { useLiveFief } from '../../fief/useLiveFief'

function FiefOverviewPage(): ReactElement {
  const { apiClient } = Route.useRouteContext()
  const state = useLiveFief(apiClient)
  switch (state.kind) {
    case 'loading':
      return <p className="m-0">{copy.fief.loading}</p>
    case 'refused':
      return <FormAlert message={copy.refusals[state.refusal]} />
    case 'live':
      return <FiefScreen fief={state.fief} slotTotalSeconds={state.slotTotalSeconds} />
    default: {
      const unreachable: never = state
      return unreachable
    }
  }
}

export const Route = createFileRoute('/_signedIn/')({
  component: FiefOverviewPage,
})
