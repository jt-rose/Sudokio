import {
  getParam,
  getOpen,
  getValues,
  SudokuGrid,
  GridParam,
} from '../utils/cellPath'

import { isOnly, Update, Solution } from '../utils/solutionObject'

// 2. Solves cell by recognizing only one option left in a single parameter
// Ex: only one answer possible in row
export default function solveSingleParam(
  sudokuGrid: SudokuGrid,
  gridParam: GridParam
) {
  const paramUsed = getParam(gridParam)
  if (!paramUsed) {
    return false
  }
  const openGrid = getOpen(gridParam, sudokuGrid)
  const allValues = getValues(openGrid, sudokuGrid).flat()
  const singleValuesFound = [...new Set(allValues)].filter(
    (x) => allValues.indexOf(x) === allValues.lastIndexOf(x)
  )
  if (singleValuesFound.length === 0) {
    return false
  }
  const indexFound = singleValuesFound.map((val) =>
    openGrid.find((x) => (sudokuGrid[x] as number[]).includes(val))
  )
  const updates = singleValuesFound.map(
    (val, i) =>
      new Update({
        index: indexFound[i] as number,
        sudokuGrid,
        removal: isOnly(val),
      })
  )
  const solutionList = indexFound.map(
    (cellFound, i) =>
      new Solution({
        strategy: `singleParam-${paramUsed}`,
        cellInit: [cellFound] as number[],
        updates: [updates[i]],
      })
  )
  return solutionList
}
