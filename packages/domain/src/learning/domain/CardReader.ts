import type { CardRepository } from './CardRepository'

export type CardReader = Pick<CardRepository, 'cardsOf'>
