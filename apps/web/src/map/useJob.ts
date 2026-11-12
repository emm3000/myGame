import type { CallJobBack, JobQuote, SendJob, TownOverview } from '@mygame/contracts'
import type { ApiClient, ApiOutcome } from '../api/apiClient'
import { type RefusedTownAction, useTownAction } from '../town/useTownAction'

export interface TownJob {
  readonly quote: (job: SendJob) => Promise<ApiOutcome<JobQuote>>
  readonly isSending: boolean
  readonly sendRefused: RefusedTownAction<string> | undefined
  readonly send: (job: SendJob, onSent: () => void) => void
  readonly isCallingBack: boolean
  readonly callBackRefused: RefusedTownAction<CallJobBack> | undefined
  readonly callBack: (target: CallJobBack) => void
}

export const sentJobKeyOf = (job: SendJob): string => JSON.stringify(job)

export function useJob(
  apiClient: ApiClient,
  adopt: (overview: TownOverview) => void,
  readAt: string,
): TownJob {
  const sending = useTownAction<string>(adopt, readAt)
  const callingBack = useTownAction<CallJobBack>(adopt, readAt)
  return {
    quote: apiClient.quoteJob,
    isSending: sending.isWaiting,
    sendRefused: sending.refused,
    send: (job, onSent) => sending.run(sentJobKeyOf(job), () => apiClient.sendJob(job), onSent),
    isCallingBack: callingBack.isWaiting,
    callBackRefused: callingBack.refused,
    callBack: (target) => callingBack.run(target, () => apiClient.callJobBack(target)),
  }
}
