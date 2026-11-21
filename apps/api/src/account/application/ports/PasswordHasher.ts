export interface PasswordHasher {
  hashOf(password: string): Promise<string>
  matches(storedHash: string | undefined, password: string): Promise<boolean>
}
