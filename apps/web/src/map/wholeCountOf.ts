const wholeCountPattern = /^[0-9]+$/

export function wholeCountOf(entry: string): number | undefined {
  if (entry === '') {
    return 0
  }
  return wholeCountPattern.test(entry) ? Number(entry) : undefined
}
