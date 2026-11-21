import { es } from '@mygame/catalog'
import type { ApiOutcome } from '../api/apiClient'
import type { OrderActionState } from '../design-system/CardAction'
import { lineLabelOf } from '../design-system/lineLabelOf'
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
  return {
    kind: 'blocked',
    reason: lineLabelOf(refusalLineOf(es, quoted.refusal, quoted.error), 'es'),
  }
}
