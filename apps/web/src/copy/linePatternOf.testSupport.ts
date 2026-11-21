const escapedOf = (text: string): string => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export const linePatternOf = (line: string, holes: ReadonlyArray<string | number>): RegExp =>
  new RegExp(
    `^${holes.reduce<string>(
      (pattern, hole) => pattern.replace(escapedOf(String(hole)), '.+?'),
      escapedOf(line),
    )}$`,
  )
