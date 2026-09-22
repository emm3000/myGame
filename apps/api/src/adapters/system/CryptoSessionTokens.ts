import { randomBytes } from 'node:crypto'

const tokenBytes = 32

export class CryptoSessionTokens {
  newToken(): string {
    return randomBytes(tokenBytes).toString('base64url')
  }
}
