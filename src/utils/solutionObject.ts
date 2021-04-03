import {
  getOpen,
  getRelCell,
  CellIndex,
  SudokuGrid,
  AnswerOptions,
  convertToArray,
} from './cellPath'
import * as R from 'ramda'

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
  startingPaths?: number[]
  totalSolutionsWithRounds?: 'change later' ////
  totalChainRounds?: number

  constructor(solutionInfo: {
    strategy: string
    cellInit: CellIndex[]
    updates: Update[]
    additionalNotes?: {
      startingPaths: number[]
      totalSolutionsWithRounds: 'change later' ////
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

// pick the simplest singleOption solutions available from the current set
// (multiple can be selected if matching complexity)
function filterBestSingleOption(solutionList: Solution[]) {
  // find solutions that only require checking a single parameter
  // Ex: (row, column, box), and don't require narrowing options
  // by previously using a more advanced strategy
  const onlySingleParam = solutionList.filter(
    (x) => !x.strategy.match(/MultiParam|Narrowing/)
  )

  if (onlySingleParam.length > 0) {
    return onlySingleParam
  }
  // if none above, find solutions that solve with multiple parameters
  // but no advanced narrowing
  const onlyMultiParam = solutionList.filter(
    (x) => !x.strategy.match(/Narrowing/)
  )

  if (onlyMultiParam.length > 0) {
    return onlyMultiParam
  }
  // else, simply return what was found
  return solutionList
}

function filterBestChain(solutionList: Solution[]) {
  // find the solutions that required the least sweeps of a chain function
  const allTotalRounds = solutionList.map(
    (solution) => solution.totalChainRounds
  ) as number[]
  const leastRounds = Math.min(...allTotalRounds)
  const solutionsWithLeastRounds = solutionList.filter(
    (solution) => solution.totalChainRounds === leastRounds
  )
  if (solutionsWithLeastRounds.length === 1) {
    return solutionsWithLeastRounds[0]
  }
  // if more than one were found with the lowest amount of sweeps,
  // prioritize those with higher amounts of updates
  const allUpdateAmounts = solutionsWithLeastRounds.map(
    (solution) => solution.updates.length
  )
  const mostUpdates = Math.max(...allUpdateAmounts)
  const solutionsWithMostUpdates = solutionsWithLeastRounds.filter(
    (solution) => solution.updates.length === mostUpdates
  )
  return solutionsWithMostUpdates[0]
}

// pick the best solution from list of those currently possible
export function filterBest(solutionList: Solution[]) {
  if (solutionList.length === 1) {
    return solutionList[0]
  }
  //"singleOption" solution will be attempted first
  // and be at start of solutionList if found
  // this will prioritize some singleOption answers over others
  if (solutionList[0].strategy.match('singleOption')) {
    return filterBestSingleOption(solutionList)
  }
  if (solutionList[0].strategy.match('singleParam')) {
    return solutionList[0]
  }
  // from a list of possible chains, prioritize easiest to find,
  // followed by most helpful
  if (solutionList[0].strategy.match('Chain')) {
    return filterBestChain(solutionList)
  }

  // check for which, if any, of the solutions found solve more cells than another
  const highestSolved = Math.max(...solutionList.map((x) => x.solved.length))
  const mostSolved = solutionList.filter(
    (x) => x.solved.length === highestSolved
  )
  if (mostSolved.length === 1) {
    return mostSolved[0]
  }

  // check for greater amount of narrowing if none were solved
  const highestNarrowed = Math.max(...mostSolved.map((x) => x.narrow.length))
  const mostNarrowed = mostSolved.filter(
    (x) => x.narrow.length === highestNarrowed
  )
  if (mostNarrowed.length === 1) {
    return mostNarrowed[0]
  }

  // if same amount of narrowing, then prioritize narowing cells that
  // are closer to being solved
  const proximityToSolve = mostNarrowed.map((item) =>
    item.narrow.reduce((sum, current) => sum + current.updatedAnswer.length, 0)
  )

  const leastLeft = proximityToSolve.indexOf(Math.min(...proximityToSolve))
  return mostNarrowed[leastLeft]
}

type SortBest = (
  solutionList: Solution[],
  sortedList: (Solution | Solution[])[]
) => SortBest | (Solution | Solution[])[]
// returns full solutionList, but sorted in order of filterBest results
const sortBestUC: SortBest = (solutionList, sortedList = []) => {
  // if all solutions have been sorted and removed from original solutionList,
  // return the completed sortedList
  if (solutionList.length === 0) {
    return sortedList
  }
  // find best current solution(s), remove from solutionList, and add to sortedList
  // before recursively calling sortBest to advance to next best solution
  const currentBestOption = filterBest(solutionList)
  const updatedSolutionList = Array.isArray(currentBestOption)
    ? solutionList.filter((x) => !currentBestOption.includes(x))
    : solutionList.filter((x) => currentBestOption !== x)
  const updatedSortedList = [...sortedList, currentBestOption]
  return sortBestUC(updatedSolutionList, updatedSortedList)
}

export const sortBest = (solutionList: Solution[]) =>
  sortBestUC(solutionList, [])

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
