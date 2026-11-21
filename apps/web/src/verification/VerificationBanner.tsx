import {
  verificationBannerLine,
  verificationBannerResend,
  verificationBannerSent,
} from '@mygame/catalog'
import type { ReactElement } from 'react'
import { lineLabelOf } from '../design-system/lineLabelOf'
import { NoticeBanner, type NoticeOutcome } from '../design-system/NoticeBanner'
import { refusalLineOf } from '../refusals/refusalLineOf'
import type { ResendState, ResendVerification } from './useResendVerification'

const outcomeOf = (state: ResendState): NoticeOutcome | undefined => {
  switch (state.kind) {
    case 'idle':
    case 'sending':
      return undefined
    case 'sent':
      return { kind: 'sent', message: lineLabelOf(verificationBannerSent(), 'es') }
    case 'refused':
      return { kind: 'failed', message: lineLabelOf(refusalLineOf(state.refusal), 'es') }
    default: {
      const unreachable: never = state
      return unreachable
    }
  }
}

export function VerificationBanner({ state, resend }: ResendVerification): ReactElement {
  return (
    <NoticeBanner
      line={lineLabelOf(verificationBannerLine(), 'es')}
      actionLabel={lineLabelOf(verificationBannerResend(), 'es')}
      isBusy={state.kind === 'sending'}
      onAction={resend}
      outcome={outcomeOf(state)}
    />
  )
}
