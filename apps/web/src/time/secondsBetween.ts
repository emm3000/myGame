export function secondsBetween(from: string, to: string): number {
  return (Date.parse(to) - Date.parse(from)) / 1000
}
