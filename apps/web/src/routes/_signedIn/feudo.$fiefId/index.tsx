import { createFileRoute } from '@tanstack/react-router'
import type { ReactElement } from 'react'
import { copy } from '../../../copy'
import type { DigestCardProps } from '../../../design-system/DigestCard'
import { FormAlert } from '../../../design-system/FormAlert'
import { digestFiefsOf } from '../../../fief/digestFiefsOf'
import { FiefScreen, type ScreenHint } from '../../../fief/FiefScreen'
import { goalCardOf } from '../../../fief/goalCardOf'
import type { LiveFief } from '../../../fief/liveFief'
import { useCancel } from '../../../fief/useCancel'
import { type DigestHandle, useDigest } from '../../../fief/useDigest'
import { useFiefNameTarget } from '../../../fief/useFiefNameTarget'
import { useGuidanceDismissal } from '../../../fief/useGuidanceDismissal'
import { useLayoutFief } from '../../../fief/useLayoutFief'
import { useRecall } from '../../../fief/useRecall'
import { useRecruit } from '../../../fief/useRecruit'
import { useStudy } from '../../../fief/useStudy'
import { useUpgrade } from '../../../fief/useUpgrade'
import { fiefHintOf } from '../../../hints/fiefHintOf'
import { hintPropsOf } from '../../../hints/hintPropsOf'
import type { HintsHandle } from '../../../hints/useHints'
import { useLayoutHints } from '../../../hints/useLayoutHints'

function digestCardOf(
  digest: DigestHandle,
  onAcknowledged: () => void,
): DigestCardProps | undefined {
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
    onAcknowledge: () => digest.acknowledge(onAcknowledged),
  }
}

function screenHintOf(fief: LiveFief, hints: HintsHandle): ScreenHint | undefined {
  const hint = fiefHintOf(fief, hints.hidden)
  if (hint === undefined || hint.kind === 'peasants' || hint.kind === 'fullStore') {
    return undefined
  }
  return { kind: hint.kind, props: hintPropsOf(hint, hints) }
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
  const hints = useLayoutHints()
  const fiefName = useFiefNameTarget()
  switch (state.kind) {
    case 'loading':
      return <p className="m-0">{copy.fief.loading}</p>
    case 'refused':
      return <FormAlert message={copy.refusals[state.refusal]} />
    case 'live':
      return (
        <FiefScreen
          fief={state.fief}
          fiefName={fiefName}
          upgrade={upgrade}
          cancel={cancel}
          study={study}
          recruit={recruit}
          recall={recall}
          digest={digestCardOf(digest, fiefName.focus)}
          goal={goalCardOf(state.fief.overview, dismissal, fiefName.focus)}
          hint={screenHintOf(state.fief, hints)}
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
