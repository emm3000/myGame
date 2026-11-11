import type { CallJobBack, SendJob, TownOverview } from '@mygame/contracts'
import type { ApiClient } from '../api/apiClient'
import { type RefusedTownAction, useTownAction } from '../town/useTownAction'

export interface TownJob {
  readonly isSending: boolean
  readonly sendRefused: RefusedTownAction<number> | undefined
  readonly send: (job: SendJob, onSent: () => void) => void
  readonly isCallingBack: boolean
  readonly callBackRefused: RefusedTownAction<CallJobBack> | undefined
  readonly callBack: (target: CallJobBack) => void
}

export function useJob(
  apiClient: ApiClient,
  adopt: (overview: TownOverview) => void,
  readAt: string,
): TownJob {
  const sending = useTownAction<number>(adopt, readAt)
  const callingBack = useTownAction<CallJobBack>(adopt, readAt)
  return {
    isSending: sending.isWaiting,
    sendRefused: sending.refused,
    send: (job, onSent) => sending.run(job.site.site, () => apiClient.sendJob(job), onSent),
    isCallingBack: callingBack.isWaiting,
    callBackRefused: callingBack.refused,
    callBack: (target) => callingBack.run(target, () => apiClient.callJobBack(target)),
  }
}
