import type { ApiOutcome } from '../api/apiClient'
import type { OrderActionState } from '../design-system/CardAction'
import { refusalLineOf } from '../refusals/refusalLineOf'

const isQuoteVerdict = <Answer>(
  quoted: ApiOutcome<Answer> | undefined,
): quoted is Extract<ApiOutcome<Answer>, { readonly ok: false }> =>
  quoted?.ok === false && quoted.refusal !== 'Unexpected'

export function sendStateOf<Answer>(
  admitted: OrderActionState,
  quoted: ApiOutcome<Answer> | undefined,
  isSendRefused: boolean,
): OrderActionState {
  if (isSendRefused || !isQuoteVerdict(quoted)) {
    return admitted
  }
  return { kind: 'blocked', reason: refusalLineOf(quoted.refusal, quoted.error) }
}
