import type { ReactElement } from 'react'
import { copy } from '../copy'
import { NoticeBanner, type NoticeOutcome } from '../design-system/NoticeBanner'
import type { ResendState, ResendVerification } from './useResendVerification'

const outcomeOf = (state: ResendState): NoticeOutcome | undefined => {
  switch (state.kind) {
    case 'idle':
    case 'sending':
      return undefined
    case 'sent':
      return { kind: 'sent', message: copy.verification.banner.sent }
    case 'refused':
      return { kind: 'failed', message: copy.refusals[state.refusal] }
    default: {
      const unreachable: never = state
      return unreachable
    }
  }
}

export function VerificationBanner({ state, resend }: ResendVerification): ReactElement {
  return (
    <NoticeBanner
      line={copy.verification.banner.line}
      actionLabel={copy.verification.banner.resend}
      isBusy={state.kind === 'sending'}
      onAction={resend}
      outcome={outcomeOf(state)}
    />
  )
}
