import { shellSignOut } from '@mygame/catalog'
import { useNavigate } from '@tanstack/react-router'
import type { ReactElement, ReactNode } from 'react'
import type { ApiClient } from '../api/apiClient'
import { Button } from '../design-system/Button'

interface SignOutColumnProps {
  readonly apiClient: ApiClient
  readonly children: ReactNode
}

export function SignOutColumn({ apiClient, children }: SignOutColumnProps): ReactElement {
  const navigate = useNavigate()
  const signOut = async (): Promise<void> => {
    await apiClient.signOut()
    await navigate({ to: '/sign-in' })
  }
  return (
    <div className="mx-auto flex w-full max-w-form flex-col gap-6">
      {children}
      <div className="-ml-1 flex">
        <Button type="button" tone="text" onClick={signOut}>
          {shellSignOut()}
        </Button>
      </div>
    </div>
  )
}
