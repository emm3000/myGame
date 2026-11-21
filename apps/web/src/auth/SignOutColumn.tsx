import { useNavigate } from '@tanstack/react-router'
import type { ReactElement, ReactNode } from 'react'
import type { ApiClient } from '../api/apiClient'
import { usePlayerCopy } from '../copy/usePlayerCopy'
import { Button } from '../design-system/Button'
import { LabelText } from '../design-system/LabelText'

interface SignOutColumnProps {
  readonly apiClient: ApiClient
  readonly children: ReactNode
  readonly beside?: ReactNode
}

export function SignOutColumn({ apiClient, children, beside }: SignOutColumnProps): ReactElement {
  const navigate = useNavigate()
  const { fixedCopy } = usePlayerCopy()
  const signOut = async (): Promise<void> => {
    await apiClient.signOut()
    await navigate({ to: '/sign-in' })
  }
  return (
    <div className="mx-auto flex w-full max-w-form flex-col gap-6">
      {children}
      <div className="-ml-1 flex flex-wrap gap-3">
        <Button type="button" tone="text" onClick={signOut}>
          <LabelText label={fixedCopy((catalog) => catalog.shellSignOut())} />
        </Button>
        {beside}
      </div>
    </div>
  )
}
