import type { DomainError } from '../DomainError'
import { err, ok, type Result } from '../Result'
import type { Cell } from './Cell'

const cellKey = ({ row, column }: Cell): string => `${row}:${column}`

export const lowestFreeCell = (
  taken: ReadonlyArray<Cell>,
  cellsPerRow: number,
): Result<Cell, DomainError> => {
  if (!Number.isInteger(cellsPerRow) || cellsPerRow < 1) {
    return err({ kind: 'InvalidCellsPerRow', cellsPerRow })
  }
  const takenCells = new Set(taken.map(cellKey))
  const cellAt = (index: number): Cell => ({
    row: Math.floor(index / cellsPerRow) + 1,
    column: (index % cellsPerRow) + 1,
  })
  let index = 0
  while (takenCells.has(cellKey(cellAt(index)))) {
    index += 1
  }
  return ok(cellAt(index))
}
