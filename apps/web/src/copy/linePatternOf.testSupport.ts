const escapedOf = (text: string): string => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const holeFilled = (pattern: string, hole: string | number): string => {
  const escapedHole = escapedOf(String(hole))
  if (!pattern.includes(escapedHole)) {
    throw new Error(`the line holds no ${hole} to open`)
  }
  return pattern.replace(escapedHole, '.+?')
}

export const linePatternOf = (line: string, holes: ReadonlyArray<string | number>): RegExp =>
  new RegExp(
    `^${holes.reduce<string>((pattern, hole) => holeFilled(pattern, hole), escapedOf(line))}$`,
  )
