import type {
  CallJobBack,
  CleanUpQuote,
  JobQuote,
  SendCleanUp,
  SendJob,
  TownOverview,
} from '@mygame/contracts'
import type { ApiClient, ApiOutcome } from '../api/apiClient'
import { type RefusedTownAction, useTownAction } from '../town/useTownAction'

export interface TownJob {
  readonly quote: (job: SendJob) => Promise<ApiOutcome<JobQuote>>
  readonly quoteCleanUp: (cleanUp: SendCleanUp) => Promise<ApiOutcome<CleanUpQuote>>
  readonly isSending: boolean
  readonly sendRefused: RefusedTownAction<string> | undefined
  readonly send: (job: SendJob, onSent: () => void) => void
  readonly sendCleanUp: (cleanUp: SendCleanUp, onSent: () => void) => void
  readonly isCallingBack: boolean
  readonly callBackRefused: RefusedTownAction<CallJobBack> | undefined
  readonly callBack: (target: CallJobBack) => void
}

export const sentKeyOf = (request: SendJob | SendCleanUp): string => JSON.stringify(request)

export function useJob(
  apiClient: ApiClient,
  adopt: (overview: TownOverview) => void,
  readAt: string,
): TownJob {
  const sending = useTownAction<string>(adopt, readAt)
  const callingBack = useTownAction<CallJobBack>(adopt, readAt)
  return {
    quote: apiClient.quoteJob,
    quoteCleanUp: apiClient.quoteCleanUp,
    isSending: sending.isWaiting,
    sendRefused: sending.refused,
    send: (job, onSent) => sending.run(sentKeyOf(job), () => apiClient.sendJob(job), onSent),
    sendCleanUp: (cleanUp, onSent) =>
      sending.run(sentKeyOf(cleanUp), () => apiClient.sendCleanUp(cleanUp), onSent),
    isCallingBack: callingBack.isWaiting,
    callBackRefused: callingBack.refused,
    callBack: (target) => callingBack.run(target, () => apiClient.callJobBack(target)),
  }
}
