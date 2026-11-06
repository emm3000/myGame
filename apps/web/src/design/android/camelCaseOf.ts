export function camelCaseOf(token: string): string {
  return token.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase())
}
