import {
  getOpen,
  getRow,
  getColumn,
  getBox,
  getUniqueSolvedValues,
  getRelCell,
  SudokuGrid,
} from '../utils/cellPath'

import { isOnly, Update, Solution } from '../utils/solutionObject'

// 1. Single Option: check if only one possible value for a cell remains open based on
// related parameters and previously eliminated options from advanced strategies.
// Determine if single option came from just one parameter(ex: row), multiple parameters
// or multiple parameters together with using advanced strategies to eliminate options.
// Our sudoku solver will give preference to solving only those with the easier method
// before re-running this function - that way, we can always priortize the simplest route.

// Due to the data structure used, this function has to do a little more work than you
// might expect. We retain only the viable answers for each cell, but when a single answer
// is left then we need to check if it came from singleOption, singleParam, boxNarrow, or others.
// This creates some additional work but also avoids having to recalculate viable answers for each
// cell along with remembering what answer sets have been narrowed.

const getStrategyType = (sudokuGrid: SudokuGrid, index: number) => {
  if (getOpen(getRow(index), sudokuGrid).length === 1) return 'singleOption-Row'
  if (getOpen(getColumn(index), sudokuGrid).length === 1)
    return 'singleOption-Column'
  if (getOpen(getBox(index), sudokuGrid).length === 1) return 'singleOption-Box'
  if (getUniqueSolvedValues(getRelCell(index), sudokuGrid).length === 8)
    return 'singleOption-MultiParam'
  return 'singleOption-Narrowing'
}

export default function solveSingleOption(
  sudokuGrid: SudokuGrid,
  index: number
) {
  // note: will still need to check for prior narrowing for data analysis
  const cellAnswer = sudokuGrid[index]
  if (Array.isArray(cellAnswer) && (cellAnswer as number[]).length === 1) {
    const strategy = getStrategyType(sudokuGrid, index)
    const updates = new Update({
      index,
      sudokuGrid,
      removal: isOnly(cellAnswer),
    })
    return new Solution({ strategy, cellInit: [index], updates: [updates] })
  }
  return false
}
