import type { Scaffold, SignUpRequest } from '@mygame/contracts'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { type ReactElement, useState } from 'react'
import type { ApiRefusal } from '../../api/apiClient'
import { SignUpScreen } from '../../auth/SignUpScreen'
import { keepSignedOutScaffold, signedOutScaffoldOf } from '../../auth/signedOutScaffold'

const browserStorage = (): Storage => window.localStorage

function SignUpRoute(): ReactElement {
  const { apiClient } = Route.useRouteContext()
  const navigate = useNavigate()
  const [refusal, setRefusal] = useState<ApiRefusal | undefined>(undefined)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [preselectedScaffold] = useState<Scaffold>(() =>
    signedOutScaffoldOf(browserStorage, navigator.language),
  )

  const signUp = async (request: SignUpRequest): Promise<void> => {
    setRefusal(undefined)
    setIsSubmitting(true)
    const outcome = await apiClient.signUp(request)
    setIsSubmitting(false)
    if (!outcome.ok) {
      setRefusal(outcome.refusal)
      return
    }
    await navigate({ to: '/' })
  }

  return (
    <SignUpScreen
      refusal={refusal}
      isSubmitting={isSubmitting}
      preselectedScaffold={preselectedScaffold}
      onScaffoldPick={(scaffold) => keepSignedOutScaffold(browserStorage, scaffold)}
      onSubmit={signUp}
    />
  )
}

export const Route = createFileRoute('/_guest/sign-up')({
  component: SignUpRoute,
})
