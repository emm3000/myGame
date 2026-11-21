import { randomBytes } from 'node:crypto'
import type { SessionTokens } from '../../application/ports/SessionTokens'

const tokenBytes = 32

export class CryptoSessionTokens implements SessionTokens {
  newToken(): string {
    return randomBytes(tokenBytes).toString('base64url')
  }
}
