import { randomBytes } from 'node:crypto'
import { hash, verify } from '@node-rs/argon2'

const decoyPasswordBytes = 32

export class Argon2Passwords {
  private readonly decoyHash: Promise<string> = hash(randomBytes(decoyPasswordBytes))

  hashOf(password: string): Promise<string> {
    return hash(password)
  }

  async matches(storedHash: string | undefined, password: string): Promise<boolean> {
    if (storedHash === undefined) {
      await verify(await this.decoyHash, password)
      return false
    }
    return verify(storedHash, password)
  }
}
