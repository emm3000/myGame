import { randomBytes } from 'node:crypto'
import type { SessionTokens } from '@mygame/domain'

const tokenBytes = 32

export class CryptoSessionTokens implements SessionTokens {
  newToken(): string {
    return randomBytes(tokenBytes).toString('base64url')
  }
}
