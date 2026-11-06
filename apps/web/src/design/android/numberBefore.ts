export function numberBefore(unit: string, value: string): number {
  if (!value.endsWith(unit)) {
    throw new Error(`${value} is not in ${unit}`)
  }
  const parsed = Number(value.slice(0, -unit.length))
  if (Number.isNaN(parsed)) {
    throw new Error(`${value} is not a number of ${unit}`)
  }
  return parsed
}
