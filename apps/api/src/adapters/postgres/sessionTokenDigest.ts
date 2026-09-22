import { createHash } from 'node:crypto'

export const sessionTokenDigest = (token: string): string =>
  createHash('sha256').update(token, 'utf8').digest('hex')
