import { signedUpAccountsOf } from '#account/testing/signedUpAccountsOf'
import type { TownStores } from '../domain/TownStores'
import type { InMemoryTownNews } from './inMemoryTownNews'
import { type HeldTownStores, inMemoryTownStores, townNewsOver } from './inMemoryTownStores'

export type SignedUpTownStores = Omit<HeldTownStores, 'accounts' | 'townNews'> & {
  readonly news: InMemoryTownNews
}

export const signedUpTownStoresOf = ({ news, ...held }: SignedUpTownStores): TownStores =>
  inMemoryTownStores({
    ...held,
    accounts: signedUpAccountsOf(['player-1']),
    townNews: townNewsOver(news),
  })
