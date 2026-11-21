const escapedOf = (text: string): string => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const holeFilled = (pattern: string, hole: string | number): string => {
  const escapedHole = escapedOf(String(hole))
  if (!pattern.includes(escapedHole)) {
    throw new Error(`the line holds no ${hole} to open`)
  }
  return pattern.replace(escapedHole, '.+?')
}

const openedLineOf = (line: string, holes: ReadonlyArray<string | number>): string =>
  holes.reduce<string>((pattern, hole) => holeFilled(pattern, hole), escapedOf(line))

export const linePatternOf = (
  lines: ReadonlyArray<string>,
  holes: ReadonlyArray<string | number>,
): RegExp => new RegExp(`^(?:${lines.map((line) => openedLineOf(line, holes)).join('|')})$`)
