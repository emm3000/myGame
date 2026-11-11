export const isWholeFromOneTo = (value: number, last: number): boolean =>
  Number.isInteger(value) && value >= 1 && value <= last
