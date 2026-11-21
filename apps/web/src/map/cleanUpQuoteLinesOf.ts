import type { CleanUpQuote } from '@mygame/contracts'
import type { PlayerCopy } from '../copy/PlayerCopy'
import type { Label } from '../design-system/Label'
import { jobPayLineOf } from './jobPayLineOf'

export interface CleanUpQuoteLines {
  readonly waste: Label
  readonly team: Label
  readonly pay: Label | undefined
  readonly short: Label | undefined
}

export function cleanUpQuoteLinesOf(quote: CleanUpQuote, copy: PlayerCopy): CleanUpQuoteLines {
  return {
    waste: copy.chrome((catalog) => catalog.mapWasteAmount({ waste: quote.waste })),
    team: copy.chrome((catalog) => catalog.mapCleanUpTeam({ strength: quote.strength })),
    pay: jobPayLineOf(copy, quote.pay, (catalog, amounts) => catalog.mapJobPay({ amounts })),
    short: quote.covers ? undefined : copy.chrome((catalog) => catalog.mapCleanUpShort()),
  }
}
