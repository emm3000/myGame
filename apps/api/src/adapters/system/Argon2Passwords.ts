import { randomBytes } from 'node:crypto'
import { hash, type Options, verify } from '@node-rs/argon2'

const decoyPasswordBytes = 32

const argon2idCost: Options = {
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
}

export class Argon2Passwords {
  private readonly decoyHash: Promise<string> = hash(randomBytes(decoyPasswordBytes), argon2idCost)

  hashOf(password: string): Promise<string> {
    return hash(password, argon2idCost)
  }

  async matches(storedHash: string | undefined, password: string): Promise<boolean> {
    if (storedHash === undefined) {
      await verify(await this.decoyHash, password)
      return false
    }
    return verify(storedHash, password)
  }
}
