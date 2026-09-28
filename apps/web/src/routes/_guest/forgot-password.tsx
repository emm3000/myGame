import { createFileRoute } from '@tanstack/react-router'
import { type ReactElement, useState } from 'react'
import {
  ForgotPasswordScreen,
  type ForgotPasswordState,
} from '../../passwordReset/ForgotPasswordScreen'

function ForgotPasswordRoute(): ReactElement {
  const { apiClient } = Route.useRouteContext()
  const [state, setState] = useState<ForgotPasswordState>({ kind: 'editing', refusal: undefined })

  const request = async (email: string): Promise<void> => {
    setState({ kind: 'sending' })
    const refusal = await apiClient.forgotPassword(email)
    setState(refusal === undefined ? { kind: 'sent' } : { kind: 'editing', refusal })
  }

  return <ForgotPasswordScreen state={state} onSubmit={request} />
}

export const Route = createFileRoute('/_guest/forgot-password')({
  component: ForgotPasswordRoute,
})
