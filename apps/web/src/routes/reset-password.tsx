import { ResetPasswordRequestSchema } from '@mygame/contracts'
import { createFileRoute } from '@tanstack/react-router'
import { type ReactElement, useState } from 'react'
import { ResetPasswordScreen, type ResetPasswordState } from '../passwordReset/ResetPasswordScreen'

interface ResetPasswordSearch {
  readonly token: string | undefined
}

function ResetPasswordRoute(): ReactElement {
  const { apiClient } = Route.useRouteContext()
  const { token } = Route.useSearch()
  const [state, setState] = useState<ResetPasswordState>(
    token === undefined ? { kind: 'linkRefused' } : { kind: 'editing', refusal: undefined },
  )

  const reset = async (password: string): Promise<void> => {
    const parsed = ResetPasswordRequestSchema.safeParse({ token, password })
    if (!parsed.success) {
      setState({ kind: 'editing', refusal: 'WeakPassword' })
      return
    }
    setState({ kind: 'sending' })
    const refusal = await apiClient.resetPassword(parsed.data)
    if (refusal === undefined) {
      setState({ kind: 'changed' })
      return
    }
    setState(refusal === 'TokenInvalid' ? { kind: 'linkRefused' } : { kind: 'editing', refusal })
  }

  return <ResetPasswordScreen state={state} onSubmit={reset} />
}

export const Route = createFileRoute('/reset-password')({
  ssr: false,
  validateSearch: (search: Record<string, unknown>): ResetPasswordSearch => {
    const parsed = ResetPasswordRequestSchema.shape.token.safeParse(search.token)
    return { token: parsed.success ? parsed.data : undefined }
  },
  component: ResetPasswordRoute,
})
