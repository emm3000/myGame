import type { CardRepository } from '@mygame/domain'

export type CardReader = Pick<CardRepository, 'cardsOf'>
