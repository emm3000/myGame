const fontWeightNames: ReadonlyMap<number, string> = new Map([
  [400, 'FontWeight.Normal'],
  [500, 'FontWeight.Medium'],
  [600, 'FontWeight.SemiBold'],
  [700, 'FontWeight.Bold'],
  [800, 'FontWeight.ExtraBold'],
])

export function fontWeightNameOf(weight: number): string {
  const name = fontWeightNames.get(weight)
  if (name === undefined) {
    throw new Error(`no FontWeight is named for ${weight}`)
  }
  return name
}
