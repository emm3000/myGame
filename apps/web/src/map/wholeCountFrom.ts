const wholeCountPattern = /^[0-9]+$/

export function wholeCountFrom(least: number, entry: string): number | undefined {
  if (!wholeCountPattern.test(entry)) {
    return undefined
  }
  const count = Number(entry)
  return count >= least ? count : undefined
}
