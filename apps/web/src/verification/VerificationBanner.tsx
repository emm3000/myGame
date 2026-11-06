import {
  passwordResetRequestSubmit,
  verificationBannerSent,
  verificationVerifyTitle,
} from '@mygame/catalog'
import type { ReactElement } from 'react'
import { NoticeBanner, type NoticeOutcome } from '../design-system/NoticeBanner'
import { refusalLineOf } from '../refusals/refusalLineOf'
import type { ResendState, ResendVerification } from './useResendVerification'

const outcomeOf = (state: ResendState): NoticeOutcome | undefined => {
  switch (state.kind) {
    case 'idle':
    case 'sending':
      return undefined
    case 'sent':
      return { kind: 'sent', message: verificationBannerSent() }
    case 'refused':
      return { kind: 'failed', message: refusalLineOf(state.refusal) }
    default: {
      const unreachable: never = state
      return unreachable
    }
  }
}

export function VerificationBanner({ state, resend }: ResendVerification): ReactElement {
  return (
    <NoticeBanner
      line={verificationVerifyTitle()}
      actionLabel={passwordResetRequestSubmit()}
      isBusy={state.kind === 'sending'}
      onAction={resend}
      outcome={outcomeOf(state)}
    />
  )
}
