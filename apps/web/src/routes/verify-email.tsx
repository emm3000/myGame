import { VerifyEmailRequestSchema } from '@mygame/contracts'
import { createFileRoute } from '@tanstack/react-router'
import type { ReactElement } from 'react'
import { useVerifyEmail } from '../verification/useVerifyEmail'
import { VerifyEmailScreen } from '../verification/VerifyEmailScreen'

interface VerifyEmailSearch {
  readonly token: string | undefined
}

function VerifyEmailPage(): ReactElement {
  const { apiClient } = Route.useRouteContext()
  const { token } = Route.useSearch()
  return <VerifyEmailScreen state={useVerifyEmail(apiClient, token)} />
}

export const Route = createFileRoute('/verify-email')({
  ssr: false,
  validateSearch: (search: Record<string, unknown>): VerifyEmailSearch => {
    const parsed = VerifyEmailRequestSchema.safeParse({ token: search.token })
    return { token: parsed.success ? parsed.data.token : undefined }
  },
  component: VerifyEmailPage,
})
