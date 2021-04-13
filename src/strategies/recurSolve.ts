import { SudokuGrid } from '../utils/cellPath'
import { updateRelCell } from '../utils/solutionObject'

// this function solves sudoku using the traditional CS method
// of recursive backtracking. This assumes the grid is the correct length
// (81 cells), so the submitted grid should be checked
// for a valid length before attempting this function. The submitted grid
// should also be formatted with the formatGrid helper function in cellPath.ts

export type SolveTraditional = (
  sudokuGrid: SudokuGrid,
  cellIndex?: number
) => SolveTraditional | SudokuGrid | false

export const solveTraditional = (
  sudokuGrid: SudokuGrid,
  cellIndex: number = 0
): SudokuGrid | false => {
  // All cells cleared! Success! Return completed grid.
  if (cellIndex > 80) {
    return sudokuGrid
  }
  // move onto next cell if current one is already answered
  if (typeof sudokuGrid[cellIndex] === 'number') {
    return solveTraditional(sudokuGrid, cellIndex + 1)
  }
  // take array of possible answers and attempt each,
  // moving forward and back recursively with each answer
  const attempt = (sudokuGrid[cellIndex] as number[]).reduce(
    (prev, currentNumber) => {
      const attemptedGrid = [
        ...sudokuGrid.slice(0, cellIndex),
        currentNumber,
        ...sudokuGrid.slice(cellIndex + 1, sudokuGrid.length),
      ]
      const formattedRelCell = updateRelCell(cellIndex, attemptedGrid)
      const nextStep = solveTraditional(formattedRelCell, cellIndex + 1)
      return prev !== false ? prev : nextStep
    },
    <false | ReturnType<typeof solveTraditional>>false
  )
  return attempt
}
