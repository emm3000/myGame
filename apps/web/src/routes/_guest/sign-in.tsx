import type { SignInRequest } from '@mygame/contracts'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { type ReactElement, useState } from 'react'
import type { ApiRefusal } from '../../api/apiClient'
import { SignInScreen } from '../../auth/SignInScreen'

function SignInRoute(): ReactElement {
  const { apiClient } = Route.useRouteContext()
  const navigate = useNavigate()
  const [refusal, setRefusal] = useState<ApiRefusal | undefined>(undefined)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const signIn = async (request: SignInRequest): Promise<void> => {
    setRefusal(undefined)
    setIsSubmitting(true)
    const outcome = await apiClient.signIn(request)
    setIsSubmitting(false)
    if (!outcome.ok) {
      setRefusal(outcome.refusal)
      return
    }
    await navigate({ to: '/' })
  }

  return <SignInScreen refusal={refusal} isSubmitting={isSubmitting} onSubmit={signIn} />
}

export const Route = createFileRoute('/_guest/sign-in')({
  component: SignInRoute,
})
