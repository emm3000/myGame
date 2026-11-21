import { randomUUID } from 'node:crypto'
import type { IdGenerator } from '@mygame/domain'

export class CryptoIdGenerator implements IdGenerator {
  newId(): string {
    return randomUUID()
  }
}
