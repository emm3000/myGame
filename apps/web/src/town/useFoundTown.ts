import { FoundTownSchema, type TownOverview } from '@mygame/contracts/town'
import { useRef, useState } from 'react'
import type { ApiClient, ApiRefusal } from '../api/apiClient'

export interface FoundTownHandle {
  readonly name: string
  readonly isSubmitting: boolean
  readonly refusal: ApiRefusal | undefined
  readonly setName: (name: string) => void
  readonly submit: () => void
}

export function useFoundTown(
  apiClient: ApiClient,
  adopt: (overview: TownOverview) => void,
): FoundTownHandle {
  const [name, setName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [refusal, setRefusal] = useState<ApiRefusal>()
  const isInFlight = useRef(false)

  const submit = async (): Promise<void> => {
    if (isInFlight.current) {
      return
    }
    const request = FoundTownSchema.safeParse({ name })
    if (!request.success) {
      setRefusal('BlankTownName')
      return
    }
    isInFlight.current = true
    setIsSubmitting(true)
    setRefusal(undefined)
    const outcome = await apiClient.foundTown(request.data.name)
    isInFlight.current = false
    setIsSubmitting(false)
    if (outcome.ok) {
      adopt(outcome.value)
      return
    }
    setRefusal(outcome.refusal)
  }

  return { name, isSubmitting, refusal, setName, submit: () => void submit() }
}
