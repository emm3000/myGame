const isAdjacentSwap = (
  left: ReadonlyArray<string>,
  right: ReadonlyArray<string>,
  row: number,
  column: number,
): boolean =>
  row > 1 &&
  column > 1 &&
  left[row - 1] === right[column - 2] &&
  left[row - 2] === right[column - 1]

export const alignmentDistanceOf = (leftText: string, rightText: string): number => {
  const left = [...leftText]
  const right = [...rightText]
  let twoRowsBack: ReadonlyArray<number> = []
  let previousRow: ReadonlyArray<number> = Array.from({ length: right.length + 1 }, (_, at) => at)
  for (let row = 1; row <= left.length; row += 1) {
    const currentRow = [row]
    for (let column = 1; column <= right.length; column += 1) {
      const substitution = left[row - 1] === right[column - 1] ? 0 : 1
      const candidates = [
        (previousRow[column] ?? row) + 1,
        (currentRow[column - 1] ?? column) + 1,
        (previousRow[column - 1] ?? row) + substitution,
      ]
      if (isAdjacentSwap(left, right, row, column)) {
        candidates.push((twoRowsBack[column - 2] ?? row) + 1)
      }
      currentRow.push(Math.min(...candidates))
    }
    twoRowsBack = previousRow
    previousRow = currentRow
  }
  return previousRow[right.length] ?? left.length
}
