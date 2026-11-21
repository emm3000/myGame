import type { ApiOutcome } from '../api/apiClient'
import type { PlayerCopy } from '../copy/PlayerCopy'
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
  copy: PlayerCopy,
): OrderActionState {
  if (isSendRefused || !isQuoteVerdict(quoted)) {
    return admitted
  }
  return {
    kind: 'blocked',
    reason: copy.fixedCopy((catalog) => refusalLineOf(catalog, quoted.refusal, quoted.error)),
  }
}
