import { mapCleanUpShort, mapCleanUpTeam, mapWasteAmount } from '@mygame/catalog'
import type { CleanUpQuote } from '@mygame/contracts'
import { jobPayLineOf } from './jobPayLineOf'

export interface CleanUpQuoteLines {
  readonly waste: string
  readonly team: string
  readonly pay: string | undefined
  readonly short: string | undefined
}

export function cleanUpQuoteLinesOf(quote: CleanUpQuote): CleanUpQuoteLines {
  return {
    waste: mapWasteAmount({ waste: quote.waste }),
    team: mapCleanUpTeam({ strength: quote.strength }),
    pay: jobPayLineOf(quote),
    short: quote.covers ? undefined : mapCleanUpShort(),
  }
}
