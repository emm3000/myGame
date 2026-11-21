import { createFileRoute } from '@tanstack/react-router'
import { type ReactElement, useState } from 'react'
import { useSignedOutCopy } from '../../auth/useSignedOutCopy'
import {
  ForgotPasswordScreen,
  type ForgotPasswordState,
} from '../../passwordReset/ForgotPasswordScreen'

function ForgotPasswordRoute(): ReactElement {
  const { apiClient } = Route.useRouteContext()
  const copy = useSignedOutCopy()
  const [state, setState] = useState<ForgotPasswordState>({ kind: 'editing', refusal: undefined })

  const request = async (email: string): Promise<void> => {
    setState({ kind: 'sending' })
    const refusal = await apiClient.forgotPassword(email)
    setState(refusal === undefined ? { kind: 'sent' } : { kind: 'editing', refusal })
  }

  return <ForgotPasswordScreen copy={copy} state={state} onSubmit={request} />
}

export const Route = createFileRoute('/_guest/forgot-password')({
  component: ForgotPasswordRoute,
})
