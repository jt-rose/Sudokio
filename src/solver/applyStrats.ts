import { cellPath as CP, SudokuGrid } from '../utils/cellPath'
import { applySolution, Solution } from '../utils/solutionObject'
import { filterBest } from '../utils/sortAndFilter'
import { isComplete } from '../utils//checkValid'
import solveSingleOption from '../strategies/singleOption'
import solveSingleParam from '../strategies/singleParam'
import solveBoxNarrow from '../strategies/boxNarrow'
import {
  solveNakedPair,
  solveNakedTriple,
  solveNakedQuad,
} from '../strategies/nakedPairings'
import {
  solveHiddenPair,
  solveHiddenTriple,
  solveHiddenQuad,
} from '../strategies/hiddenPairings'
import { solveXWing, solveSwordfish, solveJellyfish } from '../strategies/fish'

type Strategy =
  | typeof solveSingleOption
  | typeof solveSingleParam
  | typeof solveBoxNarrow
  | typeof solveNakedPair
  | typeof solveNakedTriple
  | typeof solveNakedQuad
  | typeof solveHiddenPair
  | typeof solveHiddenTriple
  | typeof solveHiddenQuad
  | typeof solveXWing
  | typeof solveSwordfish
  | typeof solveJellyfish

// Strategies were originally written to apply to isolated parameters
// (ex: rows, boxes, etc.). This function stores the strategy and applies it
// to all relevant params across the sudokuGrid to scan the full grid.
// Example: solveSingleParam can be applied to a signle row, column, or box
// but using this function can apply it to all rows, all columns, all boxes
// and produce every result across the current grid
// we can then use the filterBest function to find which is the next
// preferable (easiest or most effective) step across many similar options

//declare function solveEach(strategy: Strategy)(arr: number[]) : Solution[] | false

/*type StrategySet = /*{
  strategy: typeof solveSingleOption,
  gridParam: typeof CP.allIndex
} | */ type StrategyAcrossGridParamSets =
  | typeof solveSingleParam
  | typeof solveBoxNarrow
  | typeof solveNakedPair
  | typeof solveNakedTriple
  | typeof solveNakedQuad
  | typeof solveHiddenPair
  | typeof solveHiddenTriple
  | typeof solveHiddenQuad //,
//gridParam: typeof CP.allSets
//}

export const solveEach = (strategy: StrategyAcrossGridParamSets) => (
  gridParam: number[][]
) => (sudokuGrid: SudokuGrid) => {
  const solutionsFound = gridParam
    .map((param) => strategy(sudokuGrid, param))
    .filter((x) => x !== false)
  if (solutionsFound.length === 0) return false
  return solutionsFound as Solution[][]
  /*
  const allSolutions = settings.gridParam.reduce((solutionList, item) => {
    const solution = settings.strategy(sudokuGrid, item)
    if (solution) {
      return [...solutionList, solution]
    }
    return solutionList
  }, <Solution[][]>[])
  return allSolutions.length > 0 ? allSolutions : false*/
}

const solveSingleOptionFullGrid = (sudokuGrid: SudokuGrid) => {
  const solutionsFound = CP.allIndex
    .map((index) => solveSingleOption(sudokuGrid, index))
    .filter((x) => x !== false)
  if (solutionsFound.length === 0) return false
  return solutionsFound as Solution[]
}

// Apply strategies to full grid for a "standard" search
// fish strategies are already built to scan full grid and don't need this
//const solveSingleOptionFullGrid = solveEach(solveSingleOption)(CP.allIndex)
const solveSingleParamFullGrid = solveEach(solveSingleParam)(CP.allSets)
const solveBoxNarrowFullGrid = solveEach(solveBoxNarrow)(CP.boxSets)
const solveNakedPairFullGrid = solveEach(solveNakedPair)(CP.allSets)
const solveNakedTripleFullGrid = solveEach(solveNakedTriple)(CP.allSets)
const solveNakedQuadFullGrid = solveEach(solveNakedQuad)(CP.allSets)
const solveHiddenPairFullGrid = solveEach(solveHiddenPair)(CP.allSets)
const solveHiddenTripleFullGrid = solveEach(solveHiddenTriple)(CP.allSets)
const solveHiddenQuadFullGrid = solveEach(solveHiddenQuad)(CP.allSets)

type FishStrategy =
  | typeof solveXWing
  | typeof solveSwordfish
  | typeof solveJellyfish

const normalizeFishStrategies = (strategy: FishStrategy) => (
  sudokuGrid: SudokuGrid
) => {
  const solution = strategy(sudokuGrid)
  return solution ? [solution] : false
}

// store "standard" strategies that will be applied across the full grid
// sequentially until a hit is found
// On the site, non-fullGrid strategies can be applied
// to specific cells or params if needed with the original strategy
export const strategyList = {
  solveSingleOptionFullGrid,
  solveSingleParamFullGrid,
  solveBoxNarrowFullGrid,
  solveNakedPairFullGrid,
  solveNakedTripleFullGrid,
  solveNakedQuadFullGrid,
  solveHiddenPairFullGrid,
  solveHiddenTripleFullGrid,
  solveHiddenQuadFullGrid,
  solveXWing,
  solveSwordfish,
  solveJellyfish,
}

// take the strategyList defined above and provide string-format name
// of strategy to cut off sequence of strategies applied to sudoku grid
// for example, providing "solveBoxNarrowFullGrid" will reduce sequence of
// strategies applied to being just singleOption, singleParam, and BoxNarrow
export const limitStratsTo = (strategyString: keyof typeof strategyList) => {
  const upTo =
    Object.keys(strategyList).findIndex((x) => x.match(strategyString)) + 1

  if (upTo === 0) {
    throw new Error(
      'incorrect strategy type specified in limitStratsTo function'
    )
  }
  return Object.values(strategyList).slice(0, upTo)
}
const strategyArray = Object.values(strategyList)
// apply each strategy in succesion until a hit is found for one round
export const applyStrats = (
  stratsUsed: typeof strategyArray = strategyArray
) => (sudokuGrid: SudokuGrid) => {
  // check if any of the given strategies result in solution - single sweep of grid
  const strategies = Object.values(stratsUsed)
  if (strategies.length === 0) {
    throw new Error('must specify at least one strategy type')
  }
  return strategies.reduce((prev, strategy) => {
    if (prev !== false) {
      return prev
      // first strategy found successful will pass over later strategies
    }
    return strategy!(sudokuGrid)
  }, <Boolean | (Solution | Solution[])[]>false)
  // if none found successful, return false
}

// continue using applyStrats while updating grid with solutions found each round
// until grid is completed or found unsolvable
// applyStratsCurried will default to the full strategyList
// but can be supplied with a limited list if desired

export class GridUpdate {
  updatedGrid: SudokuGrid
  solutions: Solution[] | Solution[][]
  solved: Boolean

  constructor(
    updatedGrid: SudokuGrid,
    solutions: Solution[] | Solution[][],
    solved: Boolean
  ) {
    this.updatedGrid = updatedGrid
    this.solutions = solutions
    this.solved = solved
  }
}

type ApplyStratsUntilDone = (
  applyStratsCurried?: ReturnType<typeof applyStrats>
) => (
  sudokugrid: SudokuGrid,
  solutionList?: Solution[] | Solution[][],
  round?: number
) => ApplyStratsUntilDone | GridUpdate

export const applyStratsUntilDone: ApplyStratsUntilDone = (
  applyStratsCurried = applyStrats()
) => (sudokuGrid, solutionList = [], round = 1) => {
  // recursively transform until no further transformations available - multi sweep
  if (isComplete(sudokuGrid)) {
    return new GridUpdate(sudokuGrid, solutionList, true)
  }
  const solutionsFound = applyStratsCurried(sudokuGrid)
  if (solutionsFound === false) {
    return new GridUpdate(sudokuGrid, solutionList, false)
  }
  const flattenedSolutions = (solutionsFound as
    | Solution[]
    | Solution[][]).flat()
  const bestSolution = filterBest(flattenedSolutions)

  // add round found for each solution found during that sweep
  const solutionArray = Array.isArray(bestSolution)
    ? bestSolution
    : [bestSolution]

  const solutionWithRound = solutionArray.map((solution) => ({
    ...solution,
    round,
  }))

  const updatedGrid = applySolution(sudokuGrid, bestSolution)
  return applyStratsUntilDone(applyStratsCurried)(
    updatedGrid,
    [...solutionList, solutionWithRound].flat(),
    round + 1
  )
}
