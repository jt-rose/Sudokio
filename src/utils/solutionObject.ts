import {
  getOpen,
  getRelCell,
  CellIndex,
  SudokuGrid,
  AnswerOptions,
  convertToArray,
} from './cellPath'
import * as R from 'ramda'
import { getTotalSolutionsWithRounds } from '../strategies/chains'

// When formatting updates, answers that have been ruled out are applied
// to the removal argument in the Update class constrcutor. Occasionally we
// instead only know which answers it must be, so this function takes those
// and returns a list of the now excluded answers (reversing it, basically)
export function isOnly(answerOptions: AnswerOptions) {
  const answers = convertToArray(answerOptions)
  return [1, 2, 3, 4, 5, 6, 7, 8, 9].filter(
    (answer) => !answers.includes(answer)
  )
}

// generate object to store cell update info
export class Update {
  index: CellIndex // where the update occurs
  removal: number[] // possible answers that have been ruled out and will be removed
  currentAnswer: number[] // current possible answers
  updatedAnswer: number[] // updated possible answers

  constructor(updateInfo: {
    index: CellIndex
    sudokuGrid: SudokuGrid
    removal: number[]
  }) {
    const { index, sudokuGrid, removal } = updateInfo

    this.index = index
    this.removal = removal
    this.currentAnswer = sudokuGrid[index] as number[]
    this.updatedAnswer = (sudokuGrid[index] as number[]).filter(
      (x) => !removal.includes(x)
    )
  }
}
/*
// generate object to store cell update info
export function formatUpdate(
  index: CellIndex,
  sudokuGrid: SudokuGrid,
  removal: AnswerOptions
) {
  const remArray = convertToArray(removal)
    return {
      index,
      removal: remArray,
      currentAnswer: sudokuGrid[index],
      updatedAnswer: (sudokuGrid[index] as number[]).filter((x) => !remArray.includes(x)),
    }
}
*/

// format solution object
export class Solution {
  strategy: string
  cellInit: CellIndex[] // change to only array?
  removal: number[] // necessary?
  updates: Update[] // all updates that will occur
  narrow: Update[] // updates that will narrow possible answers in a cell
  solved: Update[] // updates that will directly solve a cell
  startingPaths?: SudokuGrid[]
  totalSolutionsWithRounds?: any //ReturnType<typeof getTotalSolutionsWithRounds> // recursive type reference
  totalChainRounds?: number
  round?: number

  constructor(solutionInfo: {
    strategy: string
    cellInit: CellIndex[]
    updates: Update[]
    additionalNotes?: {
      startingPaths: SudokuGrid[]
      totalSolutionsWithRounds: any //ReturnType<typeof getTotalSolutionsWithRounds>
      totalChainRounds: number
    }
  }) {
    const { strategy, cellInit, updates, additionalNotes } = solutionInfo

    this.strategy = strategy
    this.cellInit = cellInit
    this.updates = updates
    this.removal = updates.flatMap((u) => u.removal) //
    this.narrow = updates.filter((x) => x.updatedAnswer.length > 1)
    this.solved = updates.filter((x) => x.updatedAnswer.length === 1)

    if (additionalNotes) {
      this.startingPaths = additionalNotes.startingPaths
      this.totalSolutionsWithRounds = additionalNotes.totalSolutionsWithRounds
      this.totalChainRounds = additionalNotes.totalChainRounds
    }
  }
}

/*
// format solution object
export function formatSolution(
  strategy: string, // add string literals later
  cellInit: CellIndex | CellIndex[],
  updates: Update[]
) {
  //const updates = [].concat(updateCollection) // coerce to array if single object
  const narrow = updates.filter((x) => x.updatedAnswer.length > 1)
  const solved = updates.filter((x) => x.updatedAnswer.length === 1)
  const { removal } = updates[0]

    return { strategy, cellInit, removal, updates, narrow, solved }
}*/

// update answer options for related cells after solving a cell
export function updateRelCell(solvedIndex: CellIndex, sudokuGrid: SudokuGrid) {
  const removeAnswer = sudokuGrid[solvedIndex]
  const removeAnswerFrom = getOpen(getRelCell(solvedIndex), sudokuGrid).filter(
    (x) => x !== solvedIndex
  )

  return sudokuGrid.map((item, index) => {
    if (removeAnswerFrom.includes(index)) {
      return (item as number[]).filter((x) => x !== removeAnswer)
    }
    return item
  })
}

// update the sudokuGrid by applying the solution and returning a new grid
export function applySolutionSingle(
  sudokuGrid: SudokuGrid,
  solution: Solution
) {
  const updatedGrid = solution.updates.reduce(
    (grid, currentUpdate) =>
      currentUpdate.updatedAnswer.length === 1
        ? R.update(currentUpdate.index, currentUpdate.updatedAnswer[0], grid)
        : R.update(
            currentUpdate.index,
            (grid[currentUpdate.index] as number[]).filter((
              x // filter is used for multiple passthroughs
            ) => currentUpdate.updatedAnswer.includes(x)),
            grid
          ),
    sudokuGrid
  )

  const solvedCells = solution.solved.map((x) => x.index)
  return solvedCells.reduce(
    (grid, solvedIndex) => updateRelCell(solvedIndex, grid),
    updatedGrid
  )
}

// compose function for...
const applySolutionMultiple = (
  sudokuGrid: SudokuGrid,
  solutionList: Solution[] //////////////
) =>
  solutionList.reduce(
    (grid, solution) => applySolutionSingle(grid, solution),
    sudokuGrid
  )

// apply solution used on array of multiple solutions
//const applySolutionMultiple = applyAll(applySolutionSingle)

// checks if multiple solutions found and apply
export const applySolution = (
  sudokuGrid: SudokuGrid,
  solution: Solution[] | Solution
) => {
  return Array.isArray(solution)
    ? applySolutionMultiple(sudokuGrid, solution)
    : applySolutionSingle(sudokuGrid, solution)
}
