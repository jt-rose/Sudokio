import { cellPath as CP, getOpen, SudokuGrid } from '../utils/cellPath'
import {
  isOnly,
  Update,
  Solution,
  applySolution,
} from '../utils/solutionObject'

import { applyStrats, solveSingleOptionFullGrid } from '../solver/applyStrats'

import * as R from 'ramda' /*
  // if no shared changes, attempt next round of updates
  return findChainOverlapUpdates(
    sudokuGrid,
    currentPaths,
    stratsUsed,
    totalSolutionsWithRounds,
    round + 1
  )
}
*/ /*

const chainTemplate = (
  stratsUsed: ReturnType<typeof applyStrats>,
  answerLength: number,
  description: string
) => (sudokuGrid: SudokuGrid, cellIndex: number) => {
  // check for open with correct number of options and reject if cellIndex already solved

  const sudokuCell = sudokuGrid[cellIndex] as number[]
  if (typeof sudokuCell === 'number' || sudokuCell.length !== answerLength) {
    return false
  }
  // generate starting grids based on diverging paths
  const startingPaths = sudokuCell
    .map((answer) => isOnly(answer)) // map answers to remove
    .map((removal) => new Update({ index: cellIndex, sudokuGrid, removal })) // map updates
    .map(
      (updates) =>
        new Solution({
          strategy: 'NA-chainAttempt',
          cellInit: [cellIndex],
          updates: [updates], // convert to array
        })
    ) // map solutions
    .map((sol) => applySolution(sudokuGrid, sol)) // map starting grids
  // find first possible updates based on overlapping chains
  const chainUpdates = findChainOverlapUpdates(
    sudokuGrid,
    startingPaths,
    stratsUsed
  )
  if (!chainUpdates) {
    return false
  }

  const {
    updatesFound,
    totalSolutionsWithRounds,
    totalChainRounds,
  } = chainUpdates

  const additionalSolutionInfo = {
    startingPaths,
    totalSolutionsWithRounds,
    totalChainRounds,
  }
  return new Solution({
    strategy: description,
    cellInit: [cellIndex],
    updates: updatesFound,
    additionalNotes: additionalSolutionInfo,
  })
}

// solves x-chain on single cell
export const solveXChain = chainTemplate(
  applyStrats(limitStratsTo('solveSingleOptionFullGrid')),
  2,
  'X-Chain'
)

// expands solveXChain to apply across the full grid
//export const solveXChainFullGrid = solveEach(solveXChain)(CP.allIndex);

export const solveXChainFullGrid = (sudokuGrid: SudokuGrid) => {
  const solutionsFound = CP.allIndex
    .map((index) => solveXChain(sudokuGrid, index))
    .filter((x) => x !== false)
  if (solutionsFound.length === 0) return false
  return solutionsFound as Solution[]
}
*/ //////////////////////////////////// //redo

// 7. A chain finds a divergent pair (or more) of different possible answers
// for a cell (for example, [7,8]) and plays out what will happen if we guess
// either answer and check for any resulting answers that end up being the
// same for either path. For example, if cell 70 being a 7 or an 8 both result
// in cell 80 becoming a 3, then I know cell 80 must be 3.

// Chains can be quite flexible, as we can apply a host of other strategies
// to attempt to find updates after making our divergent paths.
// To accomodate this, I have created a curried "chainTemplate" function
// that uses the applyStrats function and can make a new chain function
// incorporating any number of strategies to apply to the divergent paths.
// For the time being, I will only be using this for the simplest chain,
// the "X-chain" applied when only two answers are left, that just checks
// for cells that become answered immediately with the "solveSingleOption"
// function.

// To simulate this with programming, we will maintain two (or more)
// separate sudoku grids, continue to work out updates that result
// with the given strategy, and then compare to see if any cells have the
// same changes for each.

// The "chainTemplate" function creates the diverging paths
// and the "findChainOverlapUpdates" function then applies strategies to each
// and checks for overlapping changes.
// The getTotalSolutionsWithRounds function updates a data tracking object
// that shows what updates were found for each sweep of the chain-link
// for each diverging sudoku grid, which can then be used with the filterbest
// function to find the easiest solution as well as used for data visualization
// to demonstrate how the chain-sweep worked

/*
export const getTotalSolutionsWithRounds = (
  currentSolutionsFound: (Solution[] | false)[],
  allSolutionsFound: (Solution[] | false)[],
  currentRound: number
) => {
  // add current round of chain-sweep to solutionsFound
  const currentSolutionsWithRound = currentSolutionsFound.map((solutionSet) =>
    solutionSet === false
      ? false
      : solutionSet.map((singleSolution) => ({
          ...singleSolution,
          chainRound: currentRound,
        }))
  )

  // keep updated data on solutions found for each divergent map
  // during each sweep of the chain updates (to use for data visualization)
  const totalSolutionsWithRounds = allSolutionsFound.length
    ? allSolutionsFound.map((solutions, i) => {
        if (solutions === false || currentSolutionsWithRound[i] === false) {
          return solutions
        } else {
          return [...solutions, currentSolutionsWithRound[i]] //solutions.concat(currentSolutionsWithRound[i]);
        }
      })
    : currentSolutionsWithRound

  return totalSolutionsWithRounds
}

class ChainUpdates {
  updatesFound: Update[]
  totalSolutionsWithRounds: ReturnType<typeof getTotalSolutionsWithRounds>
  totalChainRounds: number

  constructor(
    updatesFound: Update[],
    totalSolutionsWithRounds: ReturnType<typeof getTotalSolutionsWithRounds>,
    totalChainRounds: number
  ) {
    this.updatesFound = updatesFound
    this.totalSolutionsWithRounds = totalSolutionsWithRounds
    this.totalChainRounds = totalChainRounds
  }
}

const findChainOverlapUpdates = (
  sudokuGrid: SudokuGrid,
  startingPaths: SudokuGrid[],
  stratsUsed: ReturnType<typeof applyStrats>,
  roundUpdates: ReturnType<typeof getTotalSolutionsWithRounds> = [],
  round: number = 1
): false | ChainUpdates => {
  // apply strategy to each branch and reject if both false
  const solutionsFoundForEach = startingPaths.map((x) => stratsUsed(x))
  if (solutionsFoundForEach.every((x) => x === false)) {
    return false
  }

  const totalSolutionsWithRounds = getTotalSolutionsWithRounds(
    solutionsFoundForEach as Solution[][],
    roundUpdates,
    round
  )

  // map out updated paths with solutions found or keep old path if no update possible
  const currentPaths = solutionsFoundForEach.map((solutionSet, i) =>
    solutionSet
      ? applySolution(startingPaths[i], solutionSet)
      : startingPaths[i]
  )
  /*
///
// get indexes

// store objects of each cell index and current answers
const answerUpdates = currentPaths.map(sudoku => sudoku.map((cell, index) => ({ possibleAnswers: cell, index }))).flat()
// keep only cells that were unanswered from the original sudoku
.filter(answerObj => Array.isArray(sudokuGrid[answerObj.index]))
// remove cells that did not provide any updates from the original sudoku
.filter( answerObj => typeof answerObj === 'number' || !((sudokuGrid[answerObj.index] as number[]).every(answer => (answerObj.possibleAnswers as number[]).includes(answer))))

// get answer object indexes
const updateIndexes = answerUpdates.map(answerObj => answerObj.index)
// narrow down to indexes with updates occuring in each sudoku variation
const sharedUpdateIndexes = [...new Set(updateIndexes)].filter( indexNumber => updateIndexes.filter(num => num === indexNumber).length === currentPaths.length)

// remove updates that are not shared across all versions
//answerUpdates.filter(answerObj => sharedUpdateIndexes.includes(answerObj.index))

// group together updates
.map( index => ({ index, updateVariations: answerUpdates.filter( answerObj => answerObj.index === index )}))





// alt 
sudokuGrid.map((cell, index) => ({ index, variations: currentPaths.map( altCell => altCell[index])}) )
.filter(cellObj => cellObj.variations.every(answers => !R.equals(sudokuGrid[cellObj.index], answers)))

// remove indexes where no updates found
//.map(sudoku => sudoku.filter(answerObj => Array.isArray(sudokuGrid[answerObj.index]) && (typeof answerObj.possibleAnswers === 'number' || (sudokuGrid[answerObj.index] as number[]).some(startingAnswerOption => !(answerObj.possibleAnswers).includes(startingAnswerOption))) )

// remove cells already answered in the original sudokuGrid
//.map( sudoku => sudoku.filter( answerObj => Array.isArray(sudokuGrid[answerObj.index]))
///

*/
//orig is fine but need to check for answer present in all three
/*
  const sharedUpdates = getOpen(CP.allIndex, sudokuGrid)
    // map out variations
    .map((index) => ({
      index,
      startingValues: sudokuGrid[index] as number[],
      variations: currentPaths.map((path) => path[index]),
    }))
    // find which possible answers have been eliminated from eery variation of the chain
    .map((options) => ({
      ...options,
      eliminatedOptions: options.startingValues.filter((answer) =>
        options.variations.every(
          (answerSet) =>
            (Array.isArray(answerSet) && !answerSet.includes(answer)) ||
            answerSet !== answer
        )
      ),
    }))
    // remove cell options where no eliminations have occured
    .filter((options) => options.eliminatedOptions.length > 0)
    // format answers
    .map(
      (options) =>
        new Update({
          index: options.index,
          sudokuGrid,
          removal: options.eliminatedOptions,
        })
    )

  if (sharedUpdates.length)
    return {
      updatesFound: sharedUpdates,
      totalSolutionsWithRounds,
      totalChainRounds: round,
    }

  /*
  // find shared changes
  const holder = R.repeat([], 81)
  const sharedUpdates = currentPaths
    .reduce((prev, curr) => prev.map((x, i) => [...x, curr[i]]), holder)
    .map((x, i) => ({
      index: i,
      answerOptions: R.range(1, 10).filter((y) => x.includes(y)),// update here, if every option does not include a num from orig, then rule it out
    }))
    .filter(
      (x, i) =>
        typeof sudokuGrid[i] === 'object' && // filter out already solved
        !R.equals(x.answerOptions, sudokuGrid[i])
    )
  // if shared change(s) found, return updates for solution object
  if (sharedUpdates.length > 0) {
    const updatesFound = sharedUpdates.map(
      (x) =>
        new Update({
          index: x.index,
          sudokuGrid,
          removal: isOnly(x.answerOptions),
        })
    )
    return {
      updatesFound,
      totalSolutionsWithRounds,
      totalChainRounds: round,
    }
  }
*/ const chainTemplate = (
  applyStrategies: ReturnType<typeof applyStrats> = applyStrats(),
  description: string
) => (sudokuGrid: SudokuGrid, index: number) => {
  // reject if already solved
  if (!Array.isArray(sudokuGrid[index])) return false

  // map out starting paths of each chain
  const startingPaths = (sudokuGrid[index] as number[]).map(
    (possibleAnswer) => {
      const update = new Update({
        index,
        sudokuGrid,
        removal: isOnly(possibleAnswer),
      })
      const solution = new Solution({
        strategy: 'chain-attempt',
        cellInit: [index],
        updates: [update],
      })

      const updatedGrid = applySolution(sudokuGrid, solution)
      return { updatedGrid, solutions: [solution] }
    }
  )

  // format starting sudoku grid answer options to check against
  const st = getOpen(CP.allIndex, sudokuGrid).map((index) => ({
    index,
    answerOptions: sudokuGrid[index] as number[],
  }))

  // attempt to find shared overlapping updates on each chain path
  const sharedUpdates = findChainOverlapUpdates(
    applyStrategies,
    st,
    startingPaths.map((x) => x.updatedGrid),
    startingPaths.map((x) => x.solutions),
    1
  )
  if (!sharedUpdates) {
    return false
  }
  const updates = sharedUpdates.map(
    (update) =>
      new Update({
        index: update.index,
        sudokuGrid,
        removal: update.removedFromAllChains,
      })
  )
  const solution = new Solution({
    strategy: description,
    cellInit: [index],
    updates,
    additionalNotes: {
      startingPaths: startingPaths.map((path) => path.updatedGrid),
      totalSolutionsWithRounds: sharedUpdates,
      totalChainRounds: sharedUpdates[0].round,
    },
  })
  return solution
}

const findChainOverlapUpdates = (
  applyStrategies: ReturnType<typeof applyStrats>,
  originalSudokuAnswerOptions: { index: number; answerOptions: number[] }[],
  chainPaths: SudokuGrid[],
  updatesForEachPath: (Boolean | Solution | Solution[])[][],
  round: number
):
  | false
  | {
      removedFromAllChains: number[]
      index: number
      answerOptions: number[]
      updatesForEachPath: (Boolean | Solution | Solution[])[]
      round: number
    }[] => {
  // check if any shared updates compared to orig
  const sharedUpdates = originalSudokuAnswerOptions
    .map((cellOptions) => ({
      ...cellOptions,
      removedFromAllChains: cellOptions.answerOptions.filter((answer) =>
        chainPaths.every((path) => {
          const pathAnswers = path[cellOptions.index]
          // confirm answer has been ruled out from either the resulting answer options or the actually solved answer
          if (Array.isArray(pathAnswers)) {
            return !pathAnswers.includes(answer)
          } else {
            return pathAnswers === answer
          }
        })
      ),
    }))
    // remove any answer options where no updates were found to be shared across all chains
    .filter((options) => options.removedFromAllChains.length)

  // if any shared updates found, return result of successful chain attempt
  if (sharedUpdates.length) {
    return sharedUpdates.map((su, i) => ({
      ...su,
      updatesForEachPath: updatesForEachPath[i],
      round,
    })) //{...sharedUpdates, updatesForEachPath }
  }

  // if no shared updates found, attempt next level of chain updates
  const nextLevelOfChainUpdates = chainPaths.map((path) =>
    applyStrategies(path)
  ) as ReturnType<typeof applyStrategies>[]
  // reject chain attempt if no further updates found
  if (nextLevelOfChainUpdates.every((update) => update === false)) {
    return false
  }
  // if at least one path had an update possible, check if the resulting sudokuGrids all share the update result
  // ie: if a possible 7 has been removed from all chain paths, then we can rule it out from the original sudokuGrid
  // that each chain path is based off of

  // update each chain with respective solutions found
  const updatedChains = nextLevelOfChainUpdates.map((solution, index) =>
    solution
      ? applySolution(chainPaths[index], solution as Solution | Solution[])
      : chainPaths[index]
  )
  // recursively loop into next level, checking for shared updates and attempting next level of updates if there are still none found

  const combinedUpdatesForEachPath = updatesForEachPath.map(
    (updates, index) => {
      const newUpdates = nextLevelOfChainUpdates[index]
      const formattedNewUpdates = Array.isArray(newUpdates)
        ? newUpdates
        : [newUpdates]
      const formattedPreviousUpdates = Array.isArray(updates)
        ? updates
        : [updates]
      return [...formattedPreviousUpdates, ...formattedNewUpdates]
    }
  )
  return findChainOverlapUpdates(
    applyStrategies,
    originalSudokuAnswerOptions,
    updatedChains,
    combinedUpdatesForEachPath,
    (round += 1)
  )
}

// solves x-chain on single cell
export const solveXChain = chainTemplate(
  applyStrats([solveSingleOptionFullGrid]),
  'X-Chain'
)

// expands solveXChain to apply across the full grid
//export const solveXChainFullGrid = solveEach(solveXChain)(CP.allIndex);

export const solveXChainFullGrid = (sudokuGrid: SudokuGrid) => {
  const solutionsFound = CP.allIndex
    .map((index) => solveXChain(sudokuGrid, index))
    .filter((x) => x !== false)
  if (solutionsFound.length === 0) return false
  return solutionsFound as Solution[]
}
