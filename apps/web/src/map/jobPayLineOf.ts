import { mapJobPay } from '@mygame/catalog'
import type { JobQuote } from '@mygame/contracts'
import { amountsLineOf } from '../resources/amountsLineOf'

export function jobPayLineOf(quote: JobQuote | undefined): string | undefined {
  const amounts = quote === undefined ? undefined : amountsLineOf(quote.pay)
  return amounts === undefined ? undefined : mapJobPay({ amounts })
}
