import { createFileRoute } from '@tanstack/react-router'
import type { ReactElement } from 'react'
import { ChronicleScreen } from '../../chronicle/ChronicleScreen'
import { useChronicle } from '../../chronicle/useChronicle'

function ChroniclePage(): ReactElement {
  const { apiClient } = Route.useRouteContext()
  return <ChronicleScreen state={useChronicle(apiClient)} />
}

export const Route = createFileRoute('/_signedIn/cronica')({
  component: ChroniclePage,
})
