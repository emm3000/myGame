import { createFileRoute } from '@tanstack/react-router'
import type { ReactElement } from 'react'
import { ChronicleScreen } from '../../../chronicle/ChronicleScreen'
import { useChronicle } from '../../../chronicle/useChronicle'

function ChroniclePage(): ReactElement {
  const { apiClient } = Route.useRouteContext()
  const { fiefId } = Route.useParams()
  return <ChronicleScreen state={useChronicle(apiClient, fiefId)} />
}

export const Route = createFileRoute('/_signedIn/feudo/$fiefId/cronica')({
  component: ChroniclePage,
})
