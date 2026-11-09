import type { ApiOutcome } from '../api/apiClient'
import { numberBefore } from '../design/android/numberBefore'
import { durations } from '../design/tokens'

export const revealSeconds = numberBefore('ms', durations.reveal) / 1000
export const holdSeconds = numberBefore('ms', durations.hold) / 1000

export const skeletonBlocks = (): ReadonlyArray<Element> => [
  ...document.querySelectorAll('[data-skeleton-block]'),
]

export const neverAnswering = <T>(): Promise<ApiOutcome<T>> => new Promise(() => undefined)

export const refusedRead = async (): Promise<ApiOutcome<never>> => ({
  ok: false,
  refusal: 'Unexpected',
})

export const answeringOnDemand = <T>(
  value: T,
): {
  readonly read: () => Promise<ApiOutcome<T>>
  readonly answer: () => void
} => {
  let resolveRead = (): void => undefined
  const read = (): Promise<ApiOutcome<T>> =>
    new Promise((resolve) => {
      resolveRead = () => resolve({ ok: true, value })
    })
  return { read, answer: () => resolveRead() }
}
